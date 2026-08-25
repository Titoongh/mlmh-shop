import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { z } from 'zod'
import { safeMethodOfferSelect } from '../utils'

const requestSchema = z.object({
    offerIds: z.array(z.string()).nonempty(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = requestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    details: validation.error.errors,
                },
                { status: 400 },
            )
        }

        const { offerIds } = validation.data

        const offers = await prisma.methodOffer.findMany({
            where: {
                id: { in: offerIds },
                hidden: false,
                method: { hidden: false },
            },
            select: safeMethodOfferSelect,
        })

        if (!offers.length) {
            return NextResponse.json(
                { error: 'No method offers found' },
                { status: 404 },
            )
        }

        return NextResponse.json(offers)
    } catch (error) {
        console.error('Method offers batch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        )
    }
}
