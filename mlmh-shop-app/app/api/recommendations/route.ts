import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../admin/tablatures/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Get latest tablatures
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
            take: 8,
        })

        // Get most downloaded tablatures
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
            take: 8,
        })

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
                return tablature && !tablature.hidden
                    ? {
                          ...tablature,
                          downloadCount: item._count.id,
                      }
                    : null
            }),
        )

        // Get trending tablatures (downloaded in last 30 days)
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
            take: 8,
        })

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
                return tablature && !tablature.hidden
                    ? {
                          ...tablature,
                          recentDownloads: item._count.id,
                      }
                    : null
            }),
        )

        return NextResponse.json({
            latest: latestTablatures,
            popular: popularTablatures.filter(Boolean),
            trending: trendingTablatures.filter(Boolean),
        })
    } catch (error) {
        console.error('Error fetching recommendations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recommendations' },
            { status: 500 },
        )
    }
}
