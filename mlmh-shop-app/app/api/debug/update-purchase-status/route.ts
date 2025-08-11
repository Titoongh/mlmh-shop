import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

/**
 * DEBUG ENDPOINT: Manually update purchase status based on Stripe session
 * Use this to fix stuck PENDING purchases
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { sessionId } = await request.json()
        
        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID required' },
                { status: 400 }
            )
        }

        // Get the purchase record
        const purchase = await prisma.purchase.findUnique({
            where: { stripeSessionId: sessionId }
        })

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase not found' },
                { status: 404 }
            )
        }

        if (purchase.userId !== userId) {
            return NextResponse.json(
                { error: 'Not your purchase' },
                { status: 403 }
            )
        }

        // Get session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        
        console.log('Session details:', {
            id: session.id,
            payment_status: session.payment_status,
            status: session.status,
            amount_total: session.amount_total
        })

        // Update status based on Stripe session
        let newStatus: 'PAID' | 'FAILED' | 'CANCELLED' = 'PAID'
        
        if (session.payment_status === 'paid') {
            newStatus = 'PAID'
        } else if (session.status === 'expired') {
            newStatus = 'CANCELLED'
        } else {
            newStatus = 'FAILED'
        }

        const updatedPurchase = await prisma.purchase.update({
            where: { id: purchase.id },
            data: { 
                status: newStatus,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            purchase: {
                id: updatedPurchase.id,
                oldStatus: purchase.status,
                newStatus: updatedPurchase.status,
                sessionId: sessionId,
                stripePaymentStatus: session.payment_status,
                stripeSessionStatus: session.status
            }
        })

    } catch (error: any) {
        console.error('Error updating purchase status:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}