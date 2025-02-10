import React from 'react'
import SearchResults from '../components/Search'
import { ArtistWithTablaturesAndContents } from '../types/types'
import { MusicalGenre } from '@prisma/client'

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
    // In a real-world scenario, you might want to use environment variables for the URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/musical-genres`, {
        cache: 'no-store',
    })
    if (!res.ok) {
        throw new Error('Failed to fetch artists')
    }
    return res.json()
}

export default async function Search() {
    const initialData = await getArtists()
    const genres = await getMusicalGenres()

    return (
        <div className='flex flex-col items-center justify-start flex-grow pt-10 pb-8 bg-white-oldlace'>
            <SearchResults initialData={initialData} genres={genres} />
        </div>
    )
}
