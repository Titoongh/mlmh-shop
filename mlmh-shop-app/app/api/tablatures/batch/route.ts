import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { z } from 'zod'
import { safeTablatureSelect } from '../utils'

const requestSchema = z.object({
    ids: z.array(z.string()).nonempty(),
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

        const { ids } = validation.data

        const tablatures = await prisma.tablature.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
            select: safeTablatureSelect,
        })

        if (!tablatures.length) {
            return NextResponse.json(
                { error: 'No tablatures found' },
                { status: 404 },
            )
        }

        return NextResponse.json(tablatures)
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        )
    }
}
