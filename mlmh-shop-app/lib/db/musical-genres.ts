import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/prisma'
import type { MusicalGenre } from '@prisma/client'
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
