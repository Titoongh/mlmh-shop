import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { prisma } from '@/app/prisma'
import { ensureCustomerBeforeCheckout } from '@/services/stripe-customer'
import { getUserPurchasedTablatures } from '@/services/stripe-kv'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

export async function POST(request: Request) {
    try {
        // Step 1: Ensure user is authenticated
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { error: 'User must be authenticated to checkout' },
                { status: 401 },
            )
        }

        // Step 2: Validate request body
        const body = await request.json()
        const orderItemsSchema = z.object({
            tablatureIds: z.array(z.string()).nonempty(),
        })

        const validationResult = orderItemsSchema.safeParse(body.orderItems)
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid order items',
                    details: validationResult.error.errors,
                },
                { status: 400 },
            )
        }

        const orderItems = validationResult.data

        // Step 3: Check if user already owns these tablatures (prevent duplicate purchases)
        console.log('Checking existing purchases for user:', userId)
        const alreadyPurchased = await getUserPurchasedTablatures(userId)
        const duplicateTablatures = orderItems.tablatureIds.filter(id =>
            alreadyPurchased.includes(id),
        )

        if (duplicateTablatures.length > 0) {
            return NextResponse.json(
                {
                    error: 'Some tablatures already purchased',
                    duplicateTablatures,
                },
                { status: 400 },
            )
        }

        // Step 4: Get tablature data
        const tabs = await prisma.tablature.findMany({
            where: {
                id: { in: orderItems.tablatureIds },
                hidden: false, // Only allow purchase of visible tablatures
            },
            include: {
                artists: true,
            },
        })

        if (tabs.length !== orderItems.tablatureIds.length) {
            return NextResponse.json(
                { error: 'One or more tablatures not found or unavailable' },
                { status: 404 },
            )
        }

        // Step 5: Ensure Stripe customer exists BEFORE creating checkout session
        // This is the key point from the video - never checkout without a customer
        console.log('Ensuring Stripe customer exists for user:', userId)
        const customerId = await ensureCustomerBeforeCheckout()
        console.log('Using Stripe customer:', customerId)

        // Step 6: Create checkout session with proper customer
        const totalAmount = tabs.reduce((sum, tab) => sum + tab.price * 100, 0)

        const session = await stripe.checkout.sessions.create({
            customer: customerId, // CRITICAL: Always pass existing customer ID
            line_items: tabs.map(tab => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tab.title} - ${
                            tab.artists[0]?.name || 'Unknown Artist'
                        }`,
                        metadata: {
                            tabId: tab.id,
                            tabTitle: tab.title,
                        },
                    },
                    unit_amount: tab.price * 100,
                },
                quantity: 1,
            })),
            mode: 'payment',
            success_url: `${request.headers.get(
                'origin',
            )}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get(
                'origin',
            )}/checkout?canceled=true`,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 30, // 30 minutes
            metadata: {
                userId: userId,
                tablatureIds: JSON.stringify(orderItems.tablatureIds),
            },
            // Additional metadata in subscription_data equivalent for payments
            payment_intent_data: {
                metadata: {
                    userId: userId,
                    customerId: customerId,
                },
            },
        })

        // Step 7: Store purchase record in database
        // Create Purchase record instead of DownloadIntent
        await prisma.purchase.create({
            data: {
                stripeSessionId: session.id,
                stripeCustomerId: customerId,
                userId: userId,
                totalAmount: totalAmount,
                currency: 'usd',
                status: 'PENDING',
                purchaseItems: {
                    create: tabs.map(tab => ({
                        tablatureId: tab.id,
                        priceAtPurchase: tab.price * 100,
                        currency: 'usd',
                    })),
                },
            },
        })

        // Purchase record created - no legacy compatibility needed

        console.log(
            'Created checkout session:',
            session.id,
            'for user:',
            userId,
        )

        if (session.url) {
            return NextResponse.json({
                url: session.url,
                sessionId: session.id,
                customerId: customerId,
            })
        } else {
            return NextResponse.json(
                { error: 'Failed to create checkout session URL' },
                { status: 500 },
            )
        }
    } catch (error: any) {
        console.error('Checkout error:', error)

        // Provide different error messages based on error type
        if (error.message?.includes('authentication')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            )
        }

        if (error.message?.includes('Stripe customer')) {
            return NextResponse.json(
                { error: 'Failed to process customer information' },
                { status: 500 },
            )
        }

        return NextResponse.json(
            { error: 'Checkout failed. Please try again.' },
            { status: 500 },
        )
    }
}
