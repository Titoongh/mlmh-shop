import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/prisma'
import { isBuildPhase } from './build-phase'

// Lectures Prisma cachées par tags pour les méthodes.
// - Tag "collection" 'methods' → invalidé à chaque create/update/hide (voir
//   lib/db/revalidate.ts), couvre hub + recherche + listes.
// - Garde isBuildPhase() À L'EXTÉRIEUR de unstable_cache → build sans DB.
// - Les fichiers (MethodFile) ne sont JAMAIS inclus ici : les clés de stockage
//   des fichiers payants ne doivent pas atteindre les payloads publics.

const methodSummaryInclude = {
    musicalGenres: true,
    contents: true,
    artists: { include: { contents: true } },
    offers: { where: { hidden: false } },
    _count: { select: { lessons: true } },
} as const

const getVisibleMethodsCached = unstable_cache(
    async () => {
        try {
            return await prisma.method.findMany({
                where: { hidden: false },
                include: methodSummaryInclude,
                orderBy: { createdAt: 'desc' },
            })
        } catch (error) {
            console.error('Error fetching methods:', error)
            return []
        }
    },
    ['visible-methods'],
    { tags: ['methods'] },
)

export async function getVisibleMethods(): Promise<
    Awaited<ReturnType<typeof getVisibleMethodsCached>>
> {
    if (isBuildPhase()) return []
    return getVisibleMethodsCached()
}

// "Related volumes" pour le maillage interne des pages produit méthode : autres
// méthodes visibles partageant un artiste (couvre les liens Vol. 1 ↔ Vol. 2).
const getRelatedMethodsCached = unstable_cache(
    async (excludeMethodId: string, artistIds: string[], limit: number) => {
        try {
            return await prisma.method.findMany({
                where: {
                    hidden: false,
                    id: { not: excludeMethodId },
                    ...(artistIds.length > 0
                        ? { artists: { some: { id: { in: artistIds } } } }
                        : {}),
                },
                include: methodSummaryInclude,
                orderBy: { title: 'asc' },
                take: limit,
            })
        } catch (error) {
            console.error('Error fetching related methods:', error)
            return []
        }
    },
    ['related-methods'],
    { tags: ['methods'] },
)

export async function getRelatedMethods(
    excludeMethodId: string,
    artistIds: string[],
    limit: number,
): Promise<Awaited<ReturnType<typeof getRelatedMethodsCached>>> {
    if (isBuildPhase()) return []
    return getRelatedMethodsCached(excludeMethodId, artistIds, limit)
}
