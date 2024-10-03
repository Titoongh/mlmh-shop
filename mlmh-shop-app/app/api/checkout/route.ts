import { NextResponse } from 'next/server'
import { prisma } from '../../prisma'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

type orderItems = {
    tablatureIds: string[]
}

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
        })

        console.log('tabs', tabs)

        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            line_items: tabs.map(tab => {
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: tab.title,
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
        })

        console.log('session', session.url)

        if (session.url) {
            return NextResponse.json({ url: session.url })
        } else {
            return NextResponse.json(
                { error: 'Invalid session URL' },
                { status: 500 },
            )
        }
    } catch (err: any) {
        console.error('error', err)
        return NextResponse.json(
            { error: err.message },
            { status: err.statusCode || 500 },
        )
    }
}
