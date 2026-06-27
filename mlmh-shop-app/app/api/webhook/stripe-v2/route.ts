import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { updateDatabaseWithLatestStripeData } from '@/services/stripe-sync'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// List of events we want to process (following video pattern)
const ALLOWED_EVENTS = [
    'checkout.session.completed',
    'checkout.session.expired',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.updated',
    'customer.deleted',
    'charge.succeeded',
    'charge.failed',
] as const

async function sendDownloadEmail(email: string, downloadUrl: string) {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY!,
            },
            body: JSON.stringify({
                to: [{ email }],
                templateId: 1,
                params: {
                    downloadLink: downloadUrl,
                },
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Brevo API error: ${JSON.stringify(error)}`)
        }
    } catch (error) {
        console.error('Error sending email:', error)
        throw error
    }
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

        // Also update legacy DownloadIntent for backward compatibility
        await prisma.downloadIntent.updateMany({
            where: { stripeSessionId: sessionId },
            data: {
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

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = headers()
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

    // Return early for quick response to Stripe (following video advice)
    // We'll process in background using waitUntil pattern
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

            // Require customer ID for processing (following video pattern)
            if (!customerId) {
                console.error(
                    'No customer ID found in event:',
                    event.type,
                    event.id,
                )
                return
            }

            // KEY POINT: Don't trust webhook data directly
            // Instead, use webhook as trigger to sync fresh data from Stripe API
            console.log(
                'Syncing fresh data from Stripe for customer:',
                customerId,
            )
            await updateDatabaseWithLatestStripeData(customerId)

            // Handle specific event types with our own database updates
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session
                const customerEmail = session.customer_details?.email || null

                if (session.payment_status === 'paid') {
                    await updatePurchaseStatus(
                        session.id,
                        'PAID',
                        customerEmail || undefined,
                    )

                    // Send download email if we have customer email
                    if (customerEmail) {
                        const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id=${session.id}`
                        try {
                            await sendDownloadEmail(customerEmail, downloadUrl)
                        } catch (emailError) {
                            console.error(
                                'Failed to send download email, but purchase is valid:',
                                emailError,
                            )
                            // Don't fail the webhook for email errors
                        }
                    }
                } else {
                    console.log(
                        'Session completed but payment not successful:',
                        session.payment_status,
                    )
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

    processWebhook().catch(error => {
        console.error('Background webhook processing failed:', error)
    })

    // Return success immediately (following video advice)
    return NextResponse.json({ received: true })
}
