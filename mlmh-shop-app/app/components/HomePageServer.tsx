import { prisma } from '@/app/prisma'
import HomePageClient from './HomePageClient'

export const dynamic = 'force-dynamic'

interface RecommendationsData {
    latest: any[]
    popular: any[]
    trending: any[]
}

// Server-side data fetching with proper error handling
async function getRecommendationsData(): Promise<RecommendationsData> {
    try {
        // Get latest tablatures
        const latestTablatures = await prisma.tablature.findMany({
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                title: true,
                price: true,
                publicationDate: true,
                description: true,
                hidden: true,
                musicalGenres: true,
                contents: true,
                files: true,
                artists: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        updatedAt: true,
                        description: true,
                        hidden: true,
                        contents: true,
                        musicalGenres: true,
                        tablatures: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                hidden: true,
                                musicalGenres: true,
                            },
                        },
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
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        title: true,
                        price: true,
                        publicationDate: true,
                        description: true,
                        hidden: true,
                        musicalGenres: true,
                        contents: true,
                        files: true,
                        artists: {
                            select: {
                                id: true,
                                name: true,
                                createdAt: true,
                                updatedAt: true,
                                description: true,
                                hidden: true,
                                contents: true,
                                musicalGenres: true,
                                tablatures: {
                                    select: {
                                        id: true,
                                        title: true,
                                        price: true,
                                        hidden: true,
                                        musicalGenres: true,
                                    },
                                },
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
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        title: true,
                        price: true,
                        publicationDate: true,
                        description: true,
                        hidden: true,
                        musicalGenres: true,
                        contents: true,
                        files: true,
                        artists: {
                            select: {
                                id: true,
                                name: true,
                                createdAt: true,
                                updatedAt: true,
                                description: true,
                                hidden: true,
                                contents: true,
                                musicalGenres: true,
                                tablatures: {
                                    select: {
                                        id: true,
                                        title: true,
                                        price: true,
                                        hidden: true,
                                        musicalGenres: true,
                                    },
                                },
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

        return {
            latest: latestTablatures,
            popular: popularTablatures.filter(
                (item): item is NonNullable<typeof item> => item !== null,
            ),
            trending: trendingTablatures.filter(
                (item): item is NonNullable<typeof item> => item !== null,
            ),
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error)
        // Return empty data in case of error
        return {
            latest: [],
            popular: [],
            trending: [],
        }
    }
}

export default async function HomePageServer() {
    const recommendations = await getRecommendationsData()

    return <HomePageClient initialRecommendations={recommendations} />
}
