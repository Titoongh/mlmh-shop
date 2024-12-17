'use client'
import { ArtistHeader, ArtistTablatures } from '@/app/components/ArtistViews'
import { ArtistWithTablaturesAndContents } from '@/app/types/types'
import React, { useEffect, useState } from 'react'

interface ArtistParams {
    id: string
}

async function getArtist(id: string): Promise<ArtistWithTablaturesAndContents> {
    // In a real-world scenario, you might want to use environment variables for the URL
    const res = await fetch(`http://localhost:3000/api/artists/${id}`)
    if (!res.ok) {
        throw new Error('Failed to fetch artists')
    }
    return res.json()
}

const ArtistPage = ({ params }: { params: ArtistParams }) => {
    const { id } = params
    const [artist, setArtist] =
        useState<ArtistWithTablaturesAndContents | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getArtist(id)
            .then(data => {
                setArtist(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    return (
        artist && (
            <div className='w-full min-h-full flex flex-col justify-start items-center gap-10 py-20 bg-white-oldlace'>
                <div className='w-full flex justify-center items-center'>
                    <ArtistHeader
                        name={artist.name}
                        contents={artist.contents}
                    />
                </div>
                <div className='w-full flex flex-wrap justify-center items-center py-10'>
                    <ArtistTablatures
                        tablatures={artist.tablatures}
                        artistId={artist.id}
                    />
                </div>
            </div>
        )
    )
}

export default ArtistPage
