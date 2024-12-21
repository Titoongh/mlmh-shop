import { NextResponse } from 'next/server'
import { prisma } from '../../prisma'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

export async function POST(request: Request) {
    try {
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

        const tabs = await prisma.tablature.findMany({
            where: {
                id: {
                    in: orderItems.tablatureIds,
                },
            },
            include: {
                artists: true,
            },
        })

        const session = await stripe.checkout.sessions.create({
            line_items: tabs.map(tab => {
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: tab.title + ' - ' + tab.artists[0].name,
                            metadata: {
                                tabId: tab.id,
                            },
                        },
                        unit_amount: tab.price * 100,
                    },
                    quantity: 1,
                }
            }),
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/checkout/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/checkout/?canceled=true`,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 30, // 30 minutes
        })
        console.log('====== Checkout session created', session.id)

        await prisma.downloadIntent.create({
            data: {
                stripeSessionId: session.id,
                downloads: {
                    create: orderItems.tablatureIds.map(tablatureId => ({
                        tablatureId,
                    })),
                },
            },
        })

        if (session.url) {
            return NextResponse.json({ url: session.url })
        } else {
            return NextResponse.json(
                { error: 'Invalid session URL' },
                { status: 500 },
            )
        }
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message },
            { status: err.statusCode || 500 },
        )
    }
}
