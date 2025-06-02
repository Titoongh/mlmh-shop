import React from 'react'
import TabbedSearchResults from '../components/TabbedSearch'
import { ArtistWithTablaturesAndContents } from '../types/types'
import { MusicalGenre } from '@prisma/client'
import { SearchFilterEnum } from '../types/types'

async function getArtists(): Promise<ArtistWithTablaturesAndContents[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/artists`, {
        cache: 'no-store',
    })
    if (!res.ok) {
        throw new Error('Failed to fetch artists')
    }
    return res.json()
}

async function getMusicalGenres(): Promise<MusicalGenre[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/musical-genres`, {
        cache: 'no-store',
    })
    if (!res.ok) {
        throw new Error('Failed to fetch artists')
    }
    return res.json()
}

export default async function Search({
    searchParams,
}: {
    searchParams: { category?: string; q?: string }
}) {
    const initialData = await getArtists()
    const genres = await getMusicalGenres()

    const category =
        searchParams?.category?.toLowerCase() === 'tablature'
            ? SearchFilterEnum.TABLATURE
            : SearchFilterEnum.ARTIST

    const searchQuery = searchParams?.q || ''

    return (
        <div className='flex flex-col items-center justify-start flex-grow pt-10 pb-8 bg-white-oldlace'>
            <TabbedSearchResults
                initialData={initialData}
                genres={genres}
                initialCategory={category}
                initialSearchQuery={searchQuery}
            />
        </div>
    )
}
