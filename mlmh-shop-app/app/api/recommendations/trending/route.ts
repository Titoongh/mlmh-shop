import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../../tablatures/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Get trending tablatures based on downloads in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentDownloads = await prisma.download.groupBy({
            by: ['tablatureId'],
            _count: {
                id: true,
            },
            where: {
                downloadIntent: {
                    createdAt: {
                        gte: thirtyDaysAgo,
                    },
                    success: true,
                },
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        })

        // Get the actual tablatures with their recent download counts
        const trendingTablatures = await Promise.all(
            recentDownloads.map(async item => {
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
                    recentDownloads: item._count.id,
                }
            }),
        )

        // Filter out any null results and hidden tablatures
        const validTablatures = trendingTablatures.filter(
            tablature => tablature && !tablature.hidden,
        )

        return NextResponse.json(validTablatures)
    } catch (error) {
        console.error('Error fetching trending tablatures:', error)
        return NextResponse.json(
            { error: 'Failed to fetch trending tablatures' },
            { status: 500 },
        )
    }
}
