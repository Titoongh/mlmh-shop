import React from 'react'
import { ArtistWithTablaturesAndContents } from '../../types/types'
import { MusicalGenre } from '@prisma/client'
import { SearchFilterEnum } from '../../types/types'
import dynamic from 'next/dynamic'
import { SearchResultsProcessor } from './SearchResultsProcessor'

// Dynamically import the client component to avoid SSR issues
const SearchClient = dynamic(() => import('./SearchClient'), {
    ssr: false,
    loading: () => <div>Loading search...</div>,
})

interface SearchContainerProps {
    initialData: ArtistWithTablaturesAndContents[]
    genres: MusicalGenre[]
    initialCategory: SearchFilterEnum
    initialSearchQuery: string
}

// Server component that processes initial data and passes it to client
export default function SearchContainer({
    initialData,
    genres,
    initialCategory,
    initialSearchQuery,
}: SearchContainerProps) {
    // Process initial data on the server for better SEO and performance
    const searchProcessor = new SearchResultsProcessor(initialData)
    const processedData = searchProcessor.getProcessedData()

    return (
        <SearchClient
            initialData={initialData}
            processedData={processedData}
            genres={genres}
            initialCategory={initialCategory}
            initialSearchQuery={initialSearchQuery}
        />
    )
}
