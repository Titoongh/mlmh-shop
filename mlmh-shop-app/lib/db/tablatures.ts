import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/prisma'
import { isBuildPhase } from './build-phase'

// Lectures Prisma cachées par tags pour les tablatures.
// - Tag "collection" 'tablatures' → invalidé à chaque create/update/hide (voir
//   lib/db/revalidate.ts), couvre home + recherche + listes.
// - Garde isBuildPhase() À L'EXTÉRIEUR de unstable_cache → build sans DB.

// Sélection partagée pour les cartes de recommandation (home).
const recommendationSelect = {
    id: true,
    slug: true,
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
            slug: true,
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
                    slug: true,
                    title: true,
                    price: true,
                    hidden: true,
                    musicalGenres: true,
                },
            },
        },
    },
} as const

export interface RecommendationsData {
    latest: any[]
    popular: any[]
    trending: any[]
}

const getHomeRecommendationsCached = unstable_cache(
    async (): Promise<RecommendationsData> => {
        try {
            // Dernières tablatures
            const latestTablatures = await prisma.tablature.findMany({
                select: recommendationSelect,
                where: { hidden: false },
                orderBy: { createdAt: 'desc' },
                take: 8,
            })

            // Plus téléchargées
            const downloadCounts = await prisma.download.groupBy({
                by: ['tablatureId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 8,
            })

            const popularTablatures = await Promise.all(
                downloadCounts.map(async item => {
                    const tablature = await prisma.tablature.findUnique({
                        where: { id: item.tablatureId },
                        select: recommendationSelect,
                    })
                    return tablature && !tablature.hidden
                        ? { ...tablature, downloadCount: item._count.id }
                        : null
                }),
            )

            // Tendances (téléchargées dans les 30 derniers jours)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const recentDownloads = await prisma.download.groupBy({
                by: ['tablatureId'],
                _count: { id: true },
                where: {
                    downloadIntent: {
                        createdAt: { gte: thirtyDaysAgo },
                        success: true,
                    },
                },
                orderBy: { _count: { id: 'desc' } },
                take: 8,
            })

            const trendingTablatures = await Promise.all(
                recentDownloads.map(async item => {
                    const tablature = await prisma.tablature.findUnique({
                        where: { id: item.tablatureId },
                        select: recommendationSelect,
                    })
                    return tablature && !tablature.hidden
                        ? { ...tablature, recentDownloads: item._count.id }
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
            return { latest: [], popular: [], trending: [] }
        }
    },
    ['home-recommendations'],
    { tags: ['tablatures'] },
)

export async function getHomeRecommendations(): Promise<RecommendationsData> {
    if (isBuildPhase()) return { latest: [], popular: [], trending: [] }
    return getHomeRecommendationsCached()
}
