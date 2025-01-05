'use client'
import {
    ArtistHeader,
    ArtistTablatures,
    TablatureCard,
} from '@/app/components/ArtistViews'
import { ArtistWithTablaturesAndContents } from '@/app/types/types'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

interface ArtistParams {
    id: string
}

async function getArtist(id: string): Promise<ArtistWithTablaturesAndContents> {
    // In a real-world scenario, you might want to use environment variables for the URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/artists/${id}`, {
        cache: 'no-store',
    })
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
    }, [id])

    return (
        <div className='w-full min-h-full flex flex-col gap-8 p-6 md:p-10 bg-white-oldlace'>
            {artist && (
                <>
                    <div className='w-full bg-purple-light/10 rounded-lg mt-8'>
                        <div className='flex gap-6 flex-col md:flex-row'>
                            <div className='w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0'>
                                {artist.contents?.[0]?.url && (
                                    <Image
                                        src={artist.contents[0].url}
                                        alt={artist.name}
                                        width={192}
                                        height={192}
                                        className='object-cover w-full h-full'
                                    />
                                )}
                            </div>
                            <div className='flex flex-col flex-grow gap-4'>
                                <h1 className='text-3xl font-bold'>
                                    {artist.name}
                                </h1>
                                <p className='text-gray-600'>
                                    {artist.description ||
                                        'No description available'}
                                </p>
                                <div className='mt-auto'>
                                    <span className='text-purple-dark font-medium'>
                                        {artist.tablatures.length} tablature
                                        {artist.tablatures.length !== 1
                                            ? 's'
                                            : ''}{' '}
                                        available
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='w-full mt-10'>
                        <h2 className='text-2xl font-semibold mb-6'>
                            Tablatures
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                            {artist.tablatures.map(tab => (
                                <TablatureCard
                                    key={tab.id}
                                    tablature={tab}
                                    artist={artist}
                                    showLetterOverlay={true}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
const ArtistPageOld = ({ params }: { params: ArtistParams }) => {
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
