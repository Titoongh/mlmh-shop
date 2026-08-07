import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { triggerStripeSyncForUser } from '@/services/stripe-sync'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const requestSchema = z.object({
    sessionId: z.string().min(1),
})

export async function POST(request: Request) {
    try {
        const { userId } = await auth()

        const body = await request.json()
        const validation = requestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.errors },
                { status: 400 },
            )
        }

        const { sessionId } = validation.data

        console.log('Confirming session:', sessionId, userId ? `for user: ${userId}` : '(anonymous)')

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['customer'],
        })

        if (session.payment_status !== 'paid') {
            // Delayed-notification payment method (PayPal, Klarna, Bancontact…):
            // the customer completed checkout but the payment is still being
            // confirmed. Not an error — the webhook will finalize it.
            if (session.status === 'complete') {
                // Unless the webhook already recorded a definitive failure.
                const [purchase, downloadIntent] = await Promise.all([
                    prisma.purchase.findUnique({
                        where: { stripeSessionId: sessionId },
                        select: { status: true },
                    }),
                    prisma.downloadIntent.findUnique({
                        where: { stripeSessionId: sessionId },
                        select: { status: true },
                    }),
                ])
                if (
                    purchase?.status === 'FAILED' ||
                    downloadIntent?.status === 'FAILED'
                ) {
                    return NextResponse.json(
                        {
                            error: 'Payment failed',
                            failed: true,
                            paymentStatus: session.payment_status,
                        },
                        { status: 402 },
                    )
                }

                return NextResponse.json(
                    {
                        pending: true,
                        paymentStatus: session.payment_status,
                    },
                    { status: 202 },
                )
            }

            return NextResponse.json(
                {
                    error: 'Payment not completed',
                    paymentStatus: session.payment_status,
                },
                { status: 400 },
            )
        }

        if (userId) {
            // Authenticated flow: update Purchase record and sync
            const purchase = await prisma.purchase.findUnique({
                where: { stripeSessionId: sessionId },
                include: { purchaseItems: true },
            })

            if (purchase) {
                if (purchase.userId !== userId) {
                    return NextResponse.json(
                        { error: 'Session does not belong to current user' },
                        { status: 403 },
                    )
                }

                if (purchase.status !== 'PAID') {
                    await prisma.purchase.update({
                        where: { id: purchase.id },
                        data: { status: 'PAID', updatedAt: new Date() },
                    })
                }
            }

            console.log('Forcing Stripe data sync for user:', userId)
            await triggerStripeSyncForUser(userId)

            return NextResponse.json({
                success: true,
                mode: 'authenticated',
                sessionId,
                paymentStatus: session.payment_status,
            })
        } else {
            // Anonymous flow: verify via DownloadIntent and return tablature IDs for direct download
            const downloadIntent = await prisma.downloadIntent.findUnique({
                where: { stripeSessionId: sessionId },
                include: { downloads: true },
            })

            if (!downloadIntent) {
                return NextResponse.json(
                    { error: 'Session not found' },
                    { status: 404 },
                )
            }

            if (!downloadIntent.success) {
                await prisma.downloadIntent.update({
                    where: { id: downloadIntent.id },
                    data: { success: true, status: 'PAID', updatedAt: new Date() },
                })
            }

            const tablatureIds = downloadIntent.downloads.map(d => d.tablatureId)

            return NextResponse.json({
                success: true,
                mode: 'anonymous',
                sessionId,
                tablatureIds,
                paymentStatus: session.payment_status,
            })
        }
    } catch (error: any) {
        console.error('Error confirming session:', error)

        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json(
                { error: 'Invalid session ID' },
                { status: 404 },
            )
        }

        return NextResponse.json(
            { error: 'Failed to confirm session. Please try again.' },
            { status: 500 },
        )
    }
}
