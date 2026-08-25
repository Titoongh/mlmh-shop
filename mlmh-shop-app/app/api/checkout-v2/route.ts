import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { prisma } from '@/app/prisma'
import { ensureCustomerBeforeCheckout } from '@/services/stripe-customer'
import {
    getUserPurchasedMethodOffers,
    getUserPurchasedTablatures,
} from '@/services/stripe-kv'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

// Repeated "Proceed to Payment" clicks for the same cart (browser back from
// Stripe, then retry) used to mint a fresh session + DB row every time. With a
// deterministic idempotency key (scope = user/browser, content = full session
// params) Stripe returns the SAME open session instead, and the DB upserts
// keep a single row per session.
function checkoutIdempotencyKey(
    scope: string,
    sessionParams: Stripe.Checkout.SessionCreateParams,
): string {
    const hash = createHash('sha256')
        .update(scope)
        .update(JSON.stringify(sessionParams))
        .digest('hex')
    return `checkout:${hash}`
}

// Create (or idempotently reuse) a checkout session. If the replayed session
// is no longer usable (already paid or expired), fall back to a fresh one.
async function createOrReuseSession(
    scope: string,
    sessionParams: Stripe.Checkout.SessionCreateParams,
): Promise<Stripe.Checkout.Session> {
    const session = await stripe.checkout.sessions.create(sessionParams, {
        idempotencyKey: checkoutIdempotencyKey(scope, sessionParams),
    })
    if (session.status === 'open' && session.url) return session

    console.log(
        'Idempotent session no longer usable, creating a fresh one:',
        session.id,
        session.status,
    )
    return stripe.checkout.sessions.create(sessionParams)
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth()

        // Validate request body. Legacy payloads ({ tablatureIds: [...] })
        // still validate thanks to the defaults.
        const body = await request.json()
        const orderItemsSchema = z
            .object({
                tablatureIds: z.array(z.string()).default([]),
                methodOfferIds: z.array(z.string()).default([]),
            })
            .refine(
                items =>
                    items.tablatureIds.length > 0 ||
                    items.methodOfferIds.length > 0,
                { message: 'Order must contain at least one item' },
            )

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

        // Methods are sold to authenticated users only: the legacy guest chain
        // (DownloadIntent/Download) stays tablature-only by design.
        if (orderItems.methodOfferIds.length > 0 && !userId) {
            return NextResponse.json(
                {
                    error: 'Sign-in required to purchase methods',
                    code: 'METHOD_REQUIRES_AUTH',
                },
                { status: 401 },
            )
        }

        // Per-browser key sent by the client, used to scope session reuse for
        // anonymous visitors. Optional: without it every click creates a new
        // session (pre-existing behavior).
        const clientKey =
            typeof body.clientKey === 'string'
                ? body.clientKey.slice(0, 100)
                : null

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

            if (orderItems.methodOfferIds.length > 0) {
                const ownedOffers = await getUserPurchasedMethodOffers(userId)
                const duplicateMethodOffers =
                    orderItems.methodOfferIds.filter(id =>
                        ownedOffers.includes(id),
                    )

                if (duplicateMethodOffers.length > 0) {
                    return NextResponse.json(
                        {
                            error: 'Some method offers already purchased',
                            duplicateMethodOffers,
                        },
                        { status: 400 },
                    )
                }
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

        // Get method offer data (empty for tablature-only carts)
        const methodOffers = await prisma.methodOffer.findMany({
            where: {
                id: { in: orderItems.methodOfferIds },
                hidden: false,
                method: { hidden: false },
            },
            include: {
                method: true,
                lesson: true,
            },
        })

        if (methodOffers.length !== orderItems.methodOfferIds.length) {
            return NextResponse.json(
                { error: 'One or more method offers not found or unavailable' },
                { status: 404 },
            )
        }

        // Method amounts are rounded: prices like 24.95 * 100 give
        // 2494.9999... in floating point. Tablature lines keep the historical
        // un-rounded computation (integer prices in practice).
        const totalAmount =
            tabs.reduce((sum, tab) => sum + tab.price * 100, 0) +
            methodOffers.reduce(
                (sum, offer) => sum + Math.round(offer.price * 100),
                0,
            )

        // Stripe line items for method offers (authenticated carts only).
        // product metadata is the only product->DB mapping read back by
        // services/stripe-sync.ts.
        const methodLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
            methodOffers.map(offer => ({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${offer.method.title} - ${offer.title}`,
                        metadata: {
                            productType: 'method',
                            methodOfferId: offer.id,
                            methodId: offer.methodId,
                        },
                    },
                    unit_amount: Math.round(offer.price * 100),
                },
                quantity: 1,
            }))

        let sessionParams: Stripe.Checkout.SessionCreateParams

        if (userId) {
            // Authenticated flow: attach Stripe customer
            console.log('Ensuring Stripe customer exists for user:', userId)
            const customerId = await ensureCustomerBeforeCheckout()
            console.log('Using Stripe customer:', customerId)

            sessionParams = {
                customer: customerId,
                line_items: [
                    ...tabs.map(
                        (
                            tab,
                        ): Stripe.Checkout.SessionCreateParams.LineItem => ({
                            price_data: {
                                currency: 'eur',
                                product_data: {
                                    name: `${tab.title} - ${tab.artists[0]?.name || 'Unknown Artist'}`,
                                    metadata: {
                                        tabId: tab.id,
                                        tabTitle: tab.title,
                                    },
                                },
                                unit_amount: tab.price * 100,
                            },
                            quantity: 1,
                        }),
                    ),
                    ...methodLineItems,
                ],
                mode: 'payment',
                success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${request.headers.get('origin')}/checkout?canceled=true`,
                // No custom expires_at: Stripe's default gives customers 24h to
                // complete payment (30 min proved too short for PayPal redirects).
                metadata: {
                    userId,
                    tablatureIds: JSON.stringify(orderItems.tablatureIds),
                    methodOfferIds: JSON.stringify(orderItems.methodOfferIds),
                },
                payment_intent_data: {
                    metadata: { userId, customerId },
                },
            }

            const session = await createOrReuseSession(userId, sessionParams)

            await prisma.purchase.upsert({
                where: { stripeSessionId: session.id },
                update: {},
                create: {
                    stripeSessionId: session.id,
                    stripeCustomerId: customerId,
                    userId,
                    totalAmount,
                    currency: 'eur',
                    status: 'PENDING',
                    purchaseItems: {
                        create: [
                            ...tabs.map(tab => ({
                                tablatureId: tab.id,
                                priceAtPurchase: tab.price * 100,
                                currency: 'eur',
                            })),
                            ...methodOffers.map(offer => ({
                                methodOfferId: offer.id,
                                priceAtPurchase: Math.round(offer.price * 100),
                                currency: 'eur',
                            })),
                        ],
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
                // No custom expires_at: Stripe's default gives customers 24h to
                // complete payment (30 min proved too short for PayPal redirects).
                metadata: {
                    tablatureIds: JSON.stringify(orderItems.tablatureIds),
                },
            }

            // Without a clientKey there is no stable scope: use a random one,
            // which effectively disables reuse for that request.
            const session = await createOrReuseSession(
                clientKey ?? crypto.randomUUID(),
                sessionParams,
            )

            // Create DownloadIntent for anonymous users (legacy system).
            // Upsert: an idempotently-reused session already has its intent.
            const downloadIntent = await prisma.downloadIntent.upsert({
                where: { stripeSessionId: session.id },
                update: {},
                create: {
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
