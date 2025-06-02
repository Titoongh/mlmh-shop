import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../../tablatures/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Get latest tablatures (last 10 added)
        const latestTablatures = await prisma.tablature.findMany({
            select: {
                ...safeTablatureSelect,
                artists: {
                    select: {
                        id: true,
                        name: true,
                        contents: true,
                        musicalGenres: true,
                    },
                },
            },
            where: {
                hidden: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        })

        return NextResponse.json(latestTablatures)
    } catch (error) {
        console.error('Error fetching latest tablatures:', error)
        return NextResponse.json(
            { error: 'Failed to fetch latest tablatures' },
            { status: 500 },
        )
    }
}
