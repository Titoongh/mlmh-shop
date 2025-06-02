import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../../tablatures/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Get most popular tablatures based on actual download counts
        const downloadCounts = await prisma.download.groupBy({
            by: ['tablatureId'],
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        })

        // Get the actual tablatures with their download counts
        const popularTablatures = await Promise.all(
            downloadCounts.map(async item => {
                const tablature = await prisma.tablature.findUnique({
                    where: { id: item.tablatureId },
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
                })
                return {
                    ...tablature,
                    downloadCount: item._count.id,
                }
            }),
        )

        // Filter out any null results and hidden tablatures
        const validTablatures = popularTablatures.filter(
            tablature => tablature && !tablature.hidden,
        )

        return NextResponse.json(validTablatures)
    } catch (error) {
        console.error('Error fetching popular tablatures:', error)
        return NextResponse.json(
            { error: 'Failed to fetch popular tablatures' },
            { status: 500 },
        )
    }
}
