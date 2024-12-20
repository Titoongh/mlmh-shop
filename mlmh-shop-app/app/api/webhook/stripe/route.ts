import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

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
                templateId: 8,
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

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session

            // Vérifie que le paiement est bien confirmé
            if (session.payment_status === 'paid') {
                const customerEmail = session.customer_details?.email
                console.log('============ customerEmail', customerEmail)

                if (customerEmail) {
                    // Génère l'URL de téléchargement
                    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/download?session_id=${session.id}`

                    // Envoie l'email
                    await sendDownloadEmail(customerEmail, downloadUrl)
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        console.error('Webhook error:', err)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 400 },
        )
    }
}
