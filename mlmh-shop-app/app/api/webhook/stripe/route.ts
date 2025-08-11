import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

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
        console.error('Erreur envoi email:', error)
        throw error
    }
}

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')!

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            endpointSecret,
        )
        const session = event.data.object as Stripe.Checkout.Session
        const customerEmail: string | null =
            session.customer_details?.email || null
        if (event.type === 'checkout.session.completed') {
            if (session.payment_status === 'paid') {
                // Update DownloadIntent success status to true
                await prisma.downloadIntent.update({
                    where: { stripeSessionId: session.id },
                    data: {
                        success: true,
                        email: customerEmail as string | null,
                    },
                })

                if (customerEmail) {
                    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/download-v2?session_id=${session.id}`
                    await sendDownloadEmail(customerEmail, downloadUrl)
                } else {
                    console.error('No customer email found', session.id)
                }
            }
        } else if (event.type === 'charge.failed') {
            const charge = event.data.object as Stripe.Charge
            // We need to retrieve the session ID from the charge metadata or payment intent
            const paymentIntent = await stripe.paymentIntents.retrieve(
                charge.payment_intent as string,
            )
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
            })

            if (session.data[0]) {
                await prisma.downloadIntent.update({
                    where: { stripeSessionId: session.data[0].id },
                    data: {
                        success: false,
                        email: charge.billing_details.email as string | null,
                    },
                })
            }
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 400 },
        )
    }
}
