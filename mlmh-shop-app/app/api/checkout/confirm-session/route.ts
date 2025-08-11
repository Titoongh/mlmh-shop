import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { triggerStripeSyncForUser } from '@/services/stripe-sync'
import { getStripeCustomerForUser } from '@/services/stripe-customer'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const requestSchema = z.object({
    sessionId: z.string().min(1),
})

/**
 * Confirm checkout session and force sync of Stripe data
 * This is called from the success page to ensure data is up-to-date
 * Following the video pattern of forced sync on success page
 */
export async function POST(request: Request) {
    try {
        // Ensure user is authenticated
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Validate request
        const body = await request.json()
        const validation = requestSchema.safeParse(body)
        
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.errors },
                { status: 400 }
            )
        }

        const { sessionId } = validation.data

        console.log('Confirming session:', sessionId, 'for user:', userId)

        // Get the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['customer']
        })

        // Check if we have a Purchase record for this session
        console.log('Looking for purchase record with session ID:', sessionId)
        const purchase = await prisma.purchase.findUnique({
            where: { stripeSessionId: sessionId },
            include: {
                purchaseItems: true
            }
        })

        console.log('Found purchase:', purchase ? {
            id: purchase.id,
            userId: purchase.userId,
            status: purchase.status,
            sessionId: purchase.stripeSessionId
        } : 'null')

        if (!purchase) {
            // Maybe the Purchase table doesn't exist yet, check for DownloadIntent as fallback
            console.log('No Purchase record found, checking DownloadIntent as fallback...')
            const downloadIntent = await prisma.downloadIntent.findUnique({
                where: { stripeSessionId: sessionId }
            })
            
            if (downloadIntent) {
                console.log('Found DownloadIntent record, allowing access for migration period')
                // For now, allow legacy sessions to proceed
            } else {
                return NextResponse.json(
                    { error: 'No purchase record found for this session. The database schema may need to be updated.' },
                    { status: 404 }
                )
            }
        } else {
            // Verify session belongs to current user (only for Purchase records)
            if (purchase.userId !== userId) {
                console.error(`Purchase user ID (${purchase.userId}) does not match current user (${userId})`)
                return NextResponse.json(
                    { error: 'Session does not belong to current user' },
                    { status: 403 }
                )
            }
        }

        // Check payment status
        if (session.payment_status !== 'paid') {
            return NextResponse.json(
                { 
                    error: 'Payment not completed',
                    paymentStatus: session.payment_status,
                    sessionStatus: session.status
                },
                { status: 400 }
            )
        }

        // Update purchase status to PAID if payment was successful
        if (purchase && session.payment_status === 'paid') {
            console.log('Payment confirmed, updating purchase status to PAID')
            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { 
                    status: 'PAID',
                    updatedAt: new Date()
                }
            })
        }

        // FORCE SYNC - This is the key part from the video
        // Don't trust that webhooks have processed correctly
        // Pull fresh data from Stripe and update our database
        console.log('Forcing Stripe data sync for user:', userId)
        await triggerStripeSyncForUser(userId)

        console.log('Session confirmed and data synced for:', sessionId)

        return NextResponse.json({
            success: true,
            sessionId,
            paymentStatus: session.payment_status,
            message: 'Session confirmed and data synced'
        })

    } catch (error: any) {
        console.error('Error confirming session:', error)

        // Provide specific error messages
        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json(
                { error: 'Invalid session ID' },
                { status: 404 }
            )
        }

        if (error.message?.includes('Authentication')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to confirm session. Please try again.' },
            { status: 500 }
        )
    }
}