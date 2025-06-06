'use client'
import React, { useMemo } from 'react'
import { TablatureCard } from './ArtistViews'
import {
    TablatureWithMusicalGenres,
    ArtistWithTablaturesAndContents,
} from '../types/types'
import { DefaultLink } from './Buttons'
import { useImagePreload } from '../hooks/useImagePreload'

interface RecommendationSectionProps {
    title: string
    tablatures: Array<
        TablatureWithMusicalGenres & {
            artists: ArtistWithTablaturesAndContents[]
            downloadCount?: number
            recentDownloads?: number
        }
    >
}

export const RecommendationSection = ({
    title,
    tablatures,
}: RecommendationSectionProps) => {
    // Collect image sources for preloading (must be before early return)
    const imageSources = useMemo(() => {
        if (!tablatures || tablatures.length === 0) {
            return []
        }
        const sources: string[] = []
        tablatures.slice(0, 8).forEach(tablature => {
            const artist = tablature.artists[0]
            if (artist?.contents?.[0]?.url) {
                sources.push(artist.contents[0].url)
            }
        })
        return sources
    }, [tablatures])

    // Use the image preload hook for performance (must be before early return)
    useImagePreload(imageSources, {
        enabled: tablatures && tablatures.length > 0,
        priority: true, // Recommendations are often above-the-fold
        batchSize: 8, // Preload all visible recommendation images
    })

    if (!tablatures || tablatures.length === 0) {
        return null
    }

    return (
        <section className='w-full py-8'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-3xl font-bold text-purple-dark'>{title}</h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {tablatures.slice(0, 8).map((tablature, index) => {
                    // Get the first artist for display
                    const artist = tablature.artists[0]
                    if (!artist) return null

                    return (
                        <TablatureCard
                            key={tablature.id}
                            tablature={tablature}
                            artist={artist}
                            index={index} // Pass index for priority loading
                        />
                    )
                })}
            </div>
        </section>
    )
}

interface HeroSearchProps {
    searchValue: string
    setSearchValueAction: (value: string) => void
    onSearchAction: () => void
}

export const HeroSearch = ({
    searchValue,
    setSearchValueAction,
    onSearchAction,
}: HeroSearchProps) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearchAction()
        }
    }

    return (
        <section className='w-full bg-white-oldlace py-8 sm:py-12 lg:py-16 mb-8'>
            <div className='max-w-4xl mx-auto px-4 sm:px-6 text-center'>
                <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4'>
                    Home Cooking Guitar Tablatures
                </h1>
                <p className='text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 px-2'>
                    Professional tablatures for blues, folk & traditional
                    American music.<br></br> Expertly transcribed by a
                    passionate musician.
                </p>
                <div className='relative max-w-2xl mx-auto'>
                    <input
                        type='text'
                        placeholder='Search for artists or tablatures...'
                        value={searchValue}
                        onChange={e => setSearchValueAction(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className='w-full px-4 sm:px-6 py-3 sm:py-4 pr-20 sm:pr-16 text-base sm:text-lg rounded-full border-2 border-black bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-dark transition-all'
                    />
                    <button
                        onClick={onSearchAction}
                        className='absolute right-2 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black text-white px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-full hover:bg-gray-800 transition-colors'
                    >
                        Search
                    </button>
                </div>

                <div className='flex justify-center mt-4 sm:mt-6'>
                    <DefaultLink
                        href='/search'
                        className='px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base'
                        color='default'
                    >
                        Browse All
                    </DefaultLink>
                </div>
            </div>
        </section>
    )
}
