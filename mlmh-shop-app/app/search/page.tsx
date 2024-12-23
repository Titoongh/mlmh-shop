import React from 'react'
import SearchResults from '../components/Search'
import { ArtistWithTablaturesAndContents } from '../types/types'
import { MusicalGenre } from '@prisma/client'

async function getArtists(): Promise<ArtistWithTablaturesAndContents[]> {
    // In a real-world scenario, you might want to use environment variables for the URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/artists`, {
        cache: 'no-store',
    })
    console.log('reposne', res)
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
        <div className='flex-grow flex flex-col justify-start items-center bg-white-oldlace pt-10 pb-8'>
            <SearchResults initialData={initialData} genres={genres} />
        </div>
    )
}
