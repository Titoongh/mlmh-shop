'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    RecommendationSection,
    HeroSearch,
} from './components/RecommendationComponents'
import {
    TablatureWithMusicalGenres,
    ArtistWithTablaturesAndContents,
} from './types/types'

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

export default function Home() {
    const [recommendations, setRecommendations] =
        useState<RecommendationsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchValue, setSearchValue] = useState('')
    const router = useRouter()

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await fetch('/api/recommendations')
                if (response.ok) {
                    const data = await response.json()
                    setRecommendations(data)
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRecommendations()
    }, [])

    const handleSearch = () => {
        if (searchValue.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
        }
    }

    if (loading) {
        return (
            <main className='w-full h-full flex items-center justify-center min-h-screen bg-white-oldlace'>
                <div className='text-center'>
                    <div className='border-4 border-black bg-white p-4 mb-8'>
                        <h1 className='text-2xl font-bold text-black uppercase'>
                            Loading
                        </h1>
                    </div>
                    <div className='w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto'></div>
                </div>
            </main>
        )
    }

    return (
        <main className='w-full h-full flex flex-col bg-white-oldlace'>
            <HeroSearch
                searchValue={searchValue}
                setSearchValueAction={setSearchValue}
                onSearchAction={handleSearch}
            />

            <div className='max-w-7xl mx-auto px-6 pb-12'>
                {recommendations?.latest && (
                    <RecommendationSection
                        title='Latest Additions'
                        tablatures={recommendations.latest}
                    />
                )}

                {recommendations?.popular &&
                    recommendations.popular.length > 0 && (
                        <RecommendationSection
                            title='Most Downloaded'
                            tablatures={recommendations.popular}
                        />
                    )}

                {recommendations?.trending &&
                    recommendations.trending.length > 0 && (
                        <RecommendationSection
                            title='Trending Now'
                            tablatures={recommendations.trending}
                        />
                    )}

                {!recommendations?.latest?.length &&
                    !recommendations?.popular?.length &&
                    !recommendations?.trending?.length && (
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
