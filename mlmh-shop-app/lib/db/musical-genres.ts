import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/prisma'
import type { MusicalGenre } from '@prisma/client'
import type { ArtistWithTablaturesAndContents } from '@/app/types/types'
import { safeTablatureSelect } from '@/app/api/tablatures/utils'
import { slugify } from '@/lib/slug'
import { isBuildPhase } from './build-phase'

// Genres musicaux (avec tablatures) — collection 'musical-genres'.
// Garde isBuildPhase() À L'EXTÉRIEUR de unstable_cache → build sans DB.

const getMusicalGenresCached = unstable_cache(
    async (): Promise<MusicalGenre[]> => {
        return prisma.musicalGenre.findMany({
            include: { tablatures: true },
        })
    },
    ['musical-genres-data'],
    { tags: ['musical-genres'] },
)

export async function getMusicalGenres(): Promise<MusicalGenre[]> {
    if (isBuildPhase()) return []
    return getMusicalGenresCached()
}

// Genre + ses artistes visibles (avec contenus et tablatures visibles), pour les
// pages /genres/[slug] et l'onglet Genres de la recherche. Le slug est dérivé du
// nom (pas de colonne slug en DB, name est @unique donc dérivation stable).
export interface GenreWithCatalog extends MusicalGenre {
    slug: string
    artists: ArtistWithTablaturesAndContents[]
}

const getGenresWithArtistsCached = unstable_cache(
    async () => {
        return prisma.musicalGenre.findMany({
            include: {
                artists: {
                    where: { hidden: false },
                    include: {
                        contents: true,
                        musicalGenres: true,
                        tablatures: {
                            select: safeTablatureSelect,
                            where: { hidden: false },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        })
    },
    ['genres-with-artists-data'],
    { tags: ['musical-genres', 'artists', 'tablatures'] },
)

export async function getGenresWithArtists(): Promise<GenreWithCatalog[]> {
    if (isBuildPhase()) return []
    try {
        const genres = await getGenresWithArtistsCached()
        return genres.map(genre => ({
            ...genre,
            slug: slugify(genre.name),
        })) as GenreWithCatalog[]
    } catch (error) {
        console.error('Error fetching genres with artists:', error)
        return []
    }
}
