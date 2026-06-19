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
        const { userId } = await auth()

        // Validate request body
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

        // For authenticated users: check for duplicate purchases
        if (userId) {
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
        }

        // Get tablature data
        const tabs = await prisma.tablature.findMany({
            where: {
                id: { in: orderItems.tablatureIds },
                hidden: false,
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

        const totalAmount = tabs.reduce((sum, tab) => sum + tab.price * 100, 0)

        let sessionParams: Stripe.Checkout.SessionCreateParams

        if (userId) {
            // Authenticated flow: attach Stripe customer
            console.log('Ensuring Stripe customer exists for user:', userId)
            const customerId = await ensureCustomerBeforeCheckout()
            console.log('Using Stripe customer:', customerId)

            sessionParams = {
                customer: customerId,
                line_items: tabs.map(tab => ({
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `${tab.title} - ${tab.artists[0]?.name || 'Unknown Artist'}`,
                            metadata: { tabId: tab.id, tabTitle: tab.title },
                        },
                        unit_amount: tab.price * 100,
                    },
                    quantity: 1,
                })),
                mode: 'payment',
                success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${request.headers.get('origin')}/checkout?canceled=true`,
                expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
                metadata: {
                    userId,
                    tablatureIds: JSON.stringify(orderItems.tablatureIds),
                },
                payment_intent_data: {
                    metadata: { userId, customerId },
                },
            }

            const session = await stripe.checkout.sessions.create(sessionParams)

            await prisma.purchase.create({
                data: {
                    stripeSessionId: session.id,
                    stripeCustomerId: customerId,
                    userId,
                    totalAmount,
                    currency: 'eur',
                    status: 'PENDING',
                    purchaseItems: {
                        create: tabs.map(tab => ({
                            tablatureId: tab.id,
                            priceAtPurchase: tab.price * 100,
                            currency: 'eur',
                        })),
                    },
                },
            })

            console.log('Created checkout session:', session.id, 'for user:', userId)

            if (!session.url) {
                return NextResponse.json(
                    { error: 'Failed to create checkout session URL' },
                    { status: 500 },
                )
            }

            return NextResponse.json({ url: session.url, sessionId: session.id, customerId })
        } else {
            // Anonymous flow: no customer, use DownloadIntent
            console.log('Anonymous checkout for tablatures:', orderItems.tablatureIds)

            sessionParams = {
                line_items: tabs.map(tab => ({
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `${tab.title} - ${tab.artists[0]?.name || 'Unknown Artist'}`,
                            metadata: { tabId: tab.id, tabTitle: tab.title },
                        },
                        unit_amount: tab.price * 100,
                    },
                    quantity: 1,
                })),
                mode: 'payment',
                success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${request.headers.get('origin')}/checkout?canceled=true`,
                expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
                metadata: {
                    tablatureIds: JSON.stringify(orderItems.tablatureIds),
                },
            }

            const session = await stripe.checkout.sessions.create(sessionParams)

            // Create DownloadIntent for anonymous users (legacy system)
            const downloadIntent = await prisma.downloadIntent.create({
                data: {
                    stripeSessionId: session.id,
                    success: null,
                    downloads: {
                        create: tabs.map(tab => ({
                            tablatureId: tab.id,
                        })),
                    },
                },
            })

            console.log('Created anonymous checkout session:', session.id, 'intent:', downloadIntent.id)

            if (!session.url) {
                return NextResponse.json(
                    { error: 'Failed to create checkout session URL' },
                    { status: 500 },
                )
            }

            return NextResponse.json({ url: session.url, sessionId: session.id })
        }
    } catch (error: any) {
        console.error('Checkout error:', error)

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
