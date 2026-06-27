import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '@/app/api/tablatures/utils'
import type { ArtistWithTablaturesAndContents } from '@/app/types/types'
import { isBuildPhase } from './build-phase'

// Lectures Prisma cachées par tags pour les artistes.
// - Collection 'artists' (+ 'tablatures' car les listes embarquent les tabs).
// - Tag fin `artist:${id}` pour la page artiste.
// - Garde isBuildPhase() À L'EXTÉRIEUR de unstable_cache → build sans DB.

const getSearchArtistsCached = unstable_cache(
    async (): Promise<ArtistWithTablaturesAndContents[]> => {
        return prisma.artist.findMany({
            include: {
                tablatures: {
                    select: safeTablatureSelect,
                    where: { hidden: false },
                },
                contents: true,
                musicalGenres: true,
            },
            where: { hidden: false },
        })
    },
    ['artists-search-data'],
    { tags: ['artists', 'tablatures'] },
)

// Données de la page recherche (artistes visibles + leurs tablatures visibles).
export async function getSearchArtists(): Promise<
    ArtistWithTablaturesAndContents[]
> {
    if (isBuildPhase()) return []
    return getSearchArtistsCached()
}

// IDs des artistes visibles, pour generateStaticParams (pré-génération SSG).
export async function getVisibleArtistIds(): Promise<string[]> {
    if (isBuildPhase()) return []
    try {
        const artists = await prisma.artist.findMany({
            select: { id: true },
            where: { hidden: false },
        })
        return artists.map(a => a.id)
    } catch (error) {
        console.error('Error fetching artist ids:', error)
        return []
    }
}

// Un artiste précis pour sa page produit. Caché avec un tag fin `artist:${id}`.
export async function getArtistById(
    id: string,
): Promise<ArtistWithTablaturesAndContents | null> {
    if (isBuildPhase()) return null
    return unstable_cache(
        async () =>
            prisma.artist.findUnique({
                where: { id },
                include: {
                    tablatures: { select: safeTablatureSelect },
                    contents: true,
                    musicalGenres: true,
                },
            }),
        ['artist', id],
        { tags: ['artists', `artist:${id}`] },
    )()
}
