import React from 'react'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../api/tablatures/utils'
import SearchContainer from '../components/search/SearchContainer'
import { ArtistWithTablaturesAndContents } from '../types/types'
import { MusicalGenre } from '@prisma/client'
import { SearchFilterEnum } from '../types/types'
import { unstable_cache } from 'next/cache'

// Cached data fetching functions for better performance
const getCachedArtists = unstable_cache(
    async (): Promise<ArtistWithTablaturesAndContents[]> => {
        return await prisma.artist.findMany({
            include: {
                tablatures: {
                    select: safeTablatureSelect,
                    where: { hidden: false },
                },
                contents: true,
                musicalGenres: true,
            },
            where: {
                hidden: false,
            },
        })
    },
    ['artists-search-data'],
    {
        tags: ['artists', 'tablatures'],
        revalidate: 300, // 5 minutes cache
    },
)

const getCachedMusicalGenres = unstable_cache(
    async (): Promise<MusicalGenre[]> => {
        return await prisma.musicalGenre.findMany({
            include: {
                tablatures: true,
            },
        })
    },
    ['musical-genres-search-data'],
    {
        tags: ['musical-genres'],
        revalidate: 300, // 5 minutes cache
    },
)

export default async function Search({
    searchParams,
}: {
    searchParams: { category?: string; q?: string }
}) {
    // Fetch data in parallel for better performance
    const [initialData, genres] = await Promise.all([
        getCachedArtists(),
        getCachedMusicalGenres(),
    ])

    const category =
        searchParams?.category?.toLowerCase() === 'artist'
            ? SearchFilterEnum.ARTIST
            : SearchFilterEnum.TABLATURE

    const searchQuery = searchParams?.q || ''

    return (
        <div className='flex flex-col items-center justify-start flex-grow pt-10 pb-8 bg-white-oldlace'>
            <SearchContainer
                initialData={initialData}
                genres={genres}
                initialCategory={category}
                initialSearchQuery={searchQuery}
            />
        </div>
    )
}
