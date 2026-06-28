import React from 'react'
import type { Metadata } from 'next'
import SearchContainer from '../components/search/SearchContainer'
import { SearchFilterEnum } from '../types/types'
import { getSearchArtists } from '@/lib/db/artists'
import { getMusicalGenres } from '@/lib/db/musical-genres'

// Canonical points at the bare /search so the ?q= and ?category= variants don't
// fragment indexing into thin duplicate pages.
export const metadata: Metadata = {
    title: 'Search guitar tablatures & artists',
    description:
        'Browse and search the full catalogue of handwritten guitar tablatures by song title or artist.',
    alternates: { canonical: '/search' },
    openGraph: {
        title: 'Search guitar tablatures & artists',
        description:
            'Browse and search the full catalogue of handwritten guitar tablatures by song title or artist.',
        url: '/search',
    },
}

// Données (artistes + genres) lues via lib/db : unstable_cache taggué
// ('artists'/'tablatures'/'musical-genres'), invalidé par les mutations back-office
// au lieu d'un TTL fixe. Le shell lit searchParams pour l'état initial du client.
export default async function Search(props: {
    searchParams: Promise<{ category?: string; q?: string }>
}) {
    const searchParams = await props.searchParams
    const [initialData, genres] = await Promise.all([
        getSearchArtists(),
        getMusicalGenres(),
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
