import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '@/app/api/tablatures/utils'
import type { ArtistWithTablaturesAndContents } from '@/app/types/types'
import { isUuid } from '@/lib/slug'
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

// Slugs des artistes visibles, pour generateStaticParams (SSG).
export async function getVisibleArtistSlugs(): Promise<string[]> {
    if (isBuildPhase()) return []
    try {
        const artists = await prisma.artist.findMany({
            select: { slug: true },
            where: { hidden: false },
        })
        return artists.map(a => a.slug)
    } catch (error) {
        console.error('Error fetching artist slugs:', error)
        return []
    }
}

// Un artiste précis pour sa page produit, par slug (URLs neuves) ou UUID (legacy).
// Caché avec un tag fin `artist:${idOrSlug}` ; le tag collection 'artists' couvre
// l'invalidation sur mutation.
export async function getArtistById(
    id: string,
): Promise<ArtistWithTablaturesAndContents | null> {
    if (isBuildPhase()) return null
    return unstable_cache(
        async () =>
            prisma.artist.findUnique({
                where: isUuid(id) ? { id } : { slug: id },
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
