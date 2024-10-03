import React from 'react'
import SearchResults from '../components/Search'
import { ArtistWithTablatures } from '../types/types'

async function getArtists(): Promise<ArtistWithTablatures[]> {
    // In a real-world scenario, you might want to use environment variables for the URL
    const res = await fetch('http://localhost:3000/api/artists', {
        cache: 'no-store',
    })
    if (!res.ok) {
        throw new Error('Failed to fetch artists')
    }
    return res.json()
}

export default async function Search() {
    const initialData = await getArtists()
    console.log('initial data', initialData)

    return (
        <div className='flex-grow flex flex-col justify-start items-center bg-white-oldlace pt-10 pb-8'>
            <SearchResults initialData={initialData} />
        </div>
    )
}
