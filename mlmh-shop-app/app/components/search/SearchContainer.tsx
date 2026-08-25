import React from 'react'
import {
    ArtistWithTablaturesAndContents,
    MethodSummary,
} from '../../types/types'
import { MusicalGenre } from '@prisma/client'
import { SearchFilterEnum } from '../../types/types'
import SearchClient from './SearchClient'
import { SearchResultsProcessor } from './SearchResultsProcessor'
import type { GenreSummary } from '../ArtistViews'
import type { GenreWithCatalog } from '@/lib/db/musical-genres'

interface SearchContainerProps {
    initialData: ArtistWithTablaturesAndContents[]
    genres: MusicalGenre[]
    genresWithCatalog: GenreWithCatalog[]
    methods: MethodSummary[]
    initialCategory: SearchFilterEnum
    initialSearchQuery: string
}

// Résumés pour les briques de l'onglet Genres (comptes calculés côté serveur).
function toGenreSummaries(genres: GenreWithCatalog[]): GenreSummary[] {
    return genres
        .map(genre => {
            const tabIds = new Set<string>()
            genre.artists.forEach(artist =>
                artist.tablatures.forEach(tab => {
                    if (tab.musicalGenres.some(g => g.id === genre.id)) {
                        tabIds.add(tab.id)
                    }
                }),
            )
            return {
                id: genre.id,
                name: genre.name,
                artistCount: genre.artists.length,
                tablatureCount: tabIds.size,
                methodCount: genre.methods.length,
            }
        })
        .filter(genre => genre.artistCount > 0)
}

// Server component that processes initial data and passes it to client
export default function SearchContainer({
    initialData,
    genres,
    genresWithCatalog,
    methods,
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
            genreSummaries={toGenreSummaries(genresWithCatalog)}
            methods={methods}
            initialCategory={initialCategory}
            initialSearchQuery={initialSearchQuery}
        />
    )
}
