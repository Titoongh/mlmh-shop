'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecommendationSection, HeroSearch } from './RecommendationComponents'
import type {
    TablatureWithMusicalGenres,
    ArtistWithTablaturesAndContents,
} from '../types/types'

interface RecommendationsData {
    latest: Array<
        TablatureWithMusicalGenres & {
            artists: ArtistWithTablaturesAndContents[]
        }
    >
    popular: Array<
        TablatureWithMusicalGenres & {
            artists: ArtistWithTablaturesAndContents[]
            downloadCount: number
        }
    >
    trending: Array<
        TablatureWithMusicalGenres & {
            artists: ArtistWithTablaturesAndContents[]
            recentDownloads: number
        }
    >
}

interface HomePageClientProps {
    initialRecommendations: RecommendationsData
}

export default function HomePageClient({
    initialRecommendations,
}: HomePageClientProps) {
    const [searchValue, setSearchValue] = useState('')
    const router = useRouter()

    const handleSearch = () => {
        if (searchValue.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
        }
    }

    return (
        <main className='w-full h-full flex flex-col bg-white-oldlace'>
            <HeroSearch
                searchValue={searchValue}
                setSearchValueAction={setSearchValue}
                onSearchAction={handleSearch}
            />

            <div className='max-w-7xl mx-auto px-6 pb-12'>
                {initialRecommendations?.latest && (
                    <RecommendationSection
                        title='Latest Additions'
                        tablatures={initialRecommendations.latest}
                    />
                )}

                {initialRecommendations?.popular &&
                    initialRecommendations.popular.length > 0 && (
                        <RecommendationSection
                            title='Most Downloaded'
                            tablatures={initialRecommendations.popular}
                        />
                    )}

                {initialRecommendations?.trending &&
                    initialRecommendations.trending.length > 0 && (
                        <RecommendationSection
                            title='Trending Now'
                            tablatures={initialRecommendations.trending}
                        />
                    )}

                {!initialRecommendations?.latest?.length &&
                    !initialRecommendations?.popular?.length &&
                    !initialRecommendations?.trending?.length && (
                        <div className='text-center py-16'>
                            <h2 className='text-2xl font-semibold text-gray-700 mb-4'>
                                No tablatures available yet
                            </h2>
                            <p className='text-gray-600'>
                                Check back soon for new additions!
                            </p>
                        </div>
                    )}
            </div>
        </main>
    )
}
