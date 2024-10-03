import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { promises as fs } from 'fs'
import path from 'path'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing session ID' },
            { status: 400 },
        )
    }

    try {
        // Retrieve the session to check its payment status
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status !== 'paid') {
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 403 },
            )
        }

        const line_items = await stripe.checkout.sessions.listLineItems(
            session.id,
            {
                expand: ['data.price.product'],
            },
        )

        console.log('session', session)

        // get product data from session
        const products = line_items?.data.map((item: any) => ({
            item: item.price.product.metadata,
            quantity: item.quantity,
        }))

        console.log('products', products)

        // If payment is successful, serve the file
        const filePath = path.join(process.cwd(), 'app/assets', 'tab.jpg')
        const fileBuffer = await fs.readFile(filePath)

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Disposition': 'attachment; filename="tab.jpg"',
                'Content-Type': 'application/octet-stream',
            },
        })
    } catch (error: any) {
        console.error('Download error:', error)
        return NextResponse.json(
            { error: 'An error occurred while processing your download' },
            { status: 500 },
        )
    }
}
