import { NextResponse, after } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { updateDatabaseWithLatestStripeData } from '@/services/stripe-sync'
import {
    sendDownloadEmailOnce,
    sendPaymentFailedEmail,
} from '@/services/transactional-emails'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// List of events we want to process (following video pattern)
const ALLOWED_EVENTS = [
    'checkout.session.completed',
    'checkout.session.expired',
    // Delayed-notification payment methods (PayPal, Klarna, Bancontact, EPS):
    // `completed` fires with payment_status=unpaid, then one of these confirms.
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.updated',
    'customer.deleted',
    'charge.succeeded',
    'charge.failed',
] as const

const CHECKOUT_SESSION_EVENTS = [
    'checkout.session.completed',
    'checkout.session.expired',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
] as const

function isCheckoutSessionEvent(type: string): boolean {
    return (CHECKOUT_SESSION_EVENTS as readonly string[]).includes(type)
}


async function updatePurchaseStatus(
    sessionId: string,
    status: 'PAID' | 'FAILED' | 'CANCELLED',
    customerEmail?: string,
) {
    try {
        // Update new Purchase model
        await prisma.purchase.updateMany({
            where: { stripeSessionId: sessionId },
            data: {
                status,
                updatedAt: new Date(),
            },
        })

        // Also update legacy DownloadIntent for backward compatibility.
        // `success` keeps its historical semantics (null = never confirmed,
        // which triggers a live Stripe re-check on download); `status` is the
        // explicit lifecycle used for reporting/reconciliation.
        await prisma.downloadIntent.updateMany({
            where: { stripeSessionId: sessionId },
            data: {
                status,
                success:
                    status === 'PAID'
                        ? true
                        : status === 'FAILED'
                        ? false
                        : null,
                email: customerEmail || null,
                updatedAt: new Date(),
            },
        })

        console.log(
            `Updated purchase status to ${status} for session: ${sessionId}`,
        )
    } catch (error) {
        console.error('Error updating purchase status:', error)
        throw error
    }
}

// Shared by `checkout.session.completed` (synchronous payment methods) and
// `checkout.session.async_payment_succeeded` (PayPal, Klarna, Bancontact…).
async function handlePaidSession(session: Stripe.Checkout.Session) {
    const customerEmail = session.customer_details?.email || null

    await updatePurchaseStatus(session.id, 'PAID', customerEmail || undefined)

    try {
        // Exactly-once: no-op if the success page already sent it, and safe
        // across webhook retries / duplicate events.
        await sendDownloadEmailOnce(session.id, customerEmail)
    } catch (emailError) {
        console.error(
            'Failed to send download email, but purchase is valid:',
            emailError,
        )
        // Don't fail the webhook for email errors
    }
}

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 },
        )
    }

    // Return early for a quick ack to Stripe, but run the actual processing
    // via after() so it survives the response being sent / the connection being
    // aborted (a plain un-awaited promise is dropped when the request scope is
    // torn down, e.g. when the client times out during a cold dev compile).
    const processWebhook = async () => {
        try {
            console.log('Processing webhook event:', event.type, event.id)

            // Only process allowed events (following video pattern)
            if (!ALLOWED_EVENTS.includes(event.type as any)) {
                console.log('Event type not in allowed list:', event.type)
                return
            }

            // Extract customer ID - this is critical for sync
            let customerId: string | null = null
            let sessionId: string | null = null

            switch (event.type) {
                case 'checkout.session.completed':
                case 'checkout.session.expired':
                case 'checkout.session.async_payment_succeeded':
                case 'checkout.session.async_payment_failed':
                    const session = event.data.object as Stripe.Checkout.Session
                    customerId = session.customer as string
                    sessionId = session.id
                    break

                case 'payment_intent.succeeded':
                case 'payment_intent.payment_failed':
                    const paymentIntent = event.data
                        .object as Stripe.PaymentIntent
                    customerId = paymentIntent.customer as string
                    break

                case 'customer.updated':
                case 'customer.deleted':
                    const customer = event.data.object as Stripe.Customer
                    customerId = customer.id
                    break

                case 'charge.succeeded':
                case 'charge.failed':
                    const charge = event.data.object as Stripe.Charge
                    customerId = charge.customer as string
                    break
            }

            // Guest checkouts have no customer ID — allow checkout events through
            if (!customerId) {
                if (!isCheckoutSessionEvent(event.type)) {
                    console.error(
                        'No customer ID found in event:',
                        event.type,
                        event.id,
                    )
                    return
                }
                console.log('Guest checkout (no customer ID), skipping Stripe sync:', event.id)
            }

            // Sync with Stripe only for logged-in users who have a customer record
            if (customerId) {
                console.log(
                    'Syncing fresh data from Stripe for customer:',
                    customerId,
                )
                await updateDatabaseWithLatestStripeData(customerId)
            }

            // Handle specific event types with our own database updates
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session

                if (session.payment_status === 'paid') {
                    await handlePaidSession(session)
                } else {
                    // Delayed-notification payment method (PayPal, Klarna…):
                    // stays PENDING until async_payment_succeeded/failed arrives.
                    console.log(
                        'Session completed, awaiting async payment confirmation:',
                        session.id,
                        session.payment_status,
                    )
                }
            }

            if (event.type === 'checkout.session.async_payment_succeeded') {
                const session = event.data.object as Stripe.Checkout.Session
                await handlePaidSession(session)
            }

            if (event.type === 'checkout.session.async_payment_failed') {
                const session = event.data.object as Stripe.Checkout.Session
                await updatePurchaseStatus(session.id, 'FAILED')

                const customerEmail = session.customer_details?.email
                if (customerEmail) {
                    try {
                        await sendPaymentFailedEmail(customerEmail)
                    } catch (emailError) {
                        console.error(
                            'Failed to send payment-failed email:',
                            emailError,
                        )
                        // Don't fail the webhook for email errors
                    }
                }
            }

            if (event.type === 'checkout.session.expired') {
                const session = event.data.object as Stripe.Checkout.Session
                await updatePurchaseStatus(session.id, 'CANCELLED')
            }

            if (event.type === 'payment_intent.payment_failed') {
                // Need to find the session associated with this payment intent
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                const sessions = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                })

                if (sessions.data[0]) {
                    await updatePurchaseStatus(sessions.data[0].id, 'FAILED')
                }
            }

            console.log('Successfully processed webhook:', event.type, event.id)
        } catch (error) {
            console.error(
                'Error processing webhook:',
                event.type,
                event.id,
                error,
            )
            // Don't throw - we don't want to cause webhook retries for processing errors
            // The sync function is the source of truth, not the webhook processing
        }
    }

    // Guaranteed to run after the response, even if the connection was aborted.
    after(() =>
        processWebhook().catch(error => {
            console.error('Background webhook processing failed:', error)
        }),
    )

    // Return success immediately so Stripe doesn't retry on slow processing.
    return NextResponse.json({ received: true })
}
