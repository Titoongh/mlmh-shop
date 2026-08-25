'use client'
import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import {
    ArtistWithTablaturesAndContents,
    MethodSummary,
    SearchFilterEnum,
} from '../../types/types'
import { MusicalGenre } from '@prisma/client'
import { ProcessedSearchData } from './SearchResultsProcessor'
import SearchInput from './SearchInput'
import { cn } from '@/lib/utils'
import {
    ArtistCard,
    GenreCard,
    TablatureCard,
    type GenreSummary,
} from '../ArtistViews'
import MethodCard from '../MethodCard'
import Alert from '../Alert'
import { useImagePreload } from '../../hooks/useImagePreload'

// Custom hook for debounce
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// Tab Button component
const TabButton = ({
    active,
    onClick,
    children,
    count,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    count?: number
}) => (
    <button
        onClick={onClick}
        className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-lg border-2 px-3 py-2 text-sm font-bold transition-all gap-1.5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            active
                ? 'bg-purple-light text-purple-dark border-purple-dark shadow-small translate-x-boxSmallShadowX translate-y-boxSmallShadowY'
                : 'border-transparent text-black bg-white hover:bg-gray-100 shadow-small border-black translate-x-boxSmallShadowX translate-y-boxSmallShadowY',
        )}
    >
        <span className='flex items-center gap-2'>
            {children}
            {count !== undefined && (
                <span
                    className={cn(
                        'inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[20px] h-5 px-1.5 border border-current',
                        active
                            ? 'bg-purple-dark text-white'
                            : 'bg-black text-white',
                    )}
                >
                    {count}
                </span>
            )}
        </span>
    </button>
)

export interface SearchClientProps {
    initialData: ArtistWithTablaturesAndContents[]
    processedData: ProcessedSearchData
    genres: MusicalGenre[]
    genreSummaries: GenreSummary[]
    methods: MethodSummary[]
    initialCategory: SearchFilterEnum
    initialSearchQuery: string
}

export default function SearchClient({
    initialData,
    processedData,
    genres,
    genreSummaries,
    methods,
    initialCategory,
    initialSearchQuery,
}: SearchClientProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
    const [activeTab, setActiveTab] = useState<
        'tablatures' | 'artists' | 'genres' | 'methods'
    >(
        initialCategory === SearchFilterEnum.TABLATURE
            ? 'tablatures'
            : initialCategory === SearchFilterEnum.GENRE
              ? 'genres'
              : initialCategory === SearchFilterEnum.METHOD
                ? 'methods'
                : 'artists',
    )
    const [artistResults, setArtistResults] =
        useState<ArtistWithTablaturesAndContents[]>(initialData)
    const [tablatureResults, setTablatureResults] = useState<
        ArtistWithTablaturesAndContents[]
    >(processedData.tablatureSearchData)
    const [methodResults, setMethodResults] =
        useState<MethodSummary[]>(methods)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedGenres, setSelectedGenres] = useState<MusicalGenre[]>([])

    // Initialize Fuse instances
    const fuseArtist = useMemo(
        () => new Fuse(initialData, processedData.fuseArtistOptions),
        [initialData, processedData.fuseArtistOptions],
    )

    const fuseTablatures = useMemo(
        () =>
            new Fuse(
                processedData.tablatureSearchData,
                processedData.fuseTablatureOptions,
            ),
        [processedData.tablatureSearchData, processedData.fuseTablatureOptions],
    )

    const fuseMethods = useMemo(
        () =>
            new Fuse(methods, {
                keys: ['title', 'artists.name'],
                threshold: 0.4,
            }),
        [methods],
    )

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Search logic
    useEffect(() => {
        setIsLoading(true)
        const selectedGenresNames = selectedGenres.map(genre => genre.name)

        // Search artists
        let artistSearchResults: ArtistWithTablaturesAndContents[] = []
        if (debouncedSearchQuery && debouncedSearchQuery.length > 0) {
            const results = fuseArtist.search(debouncedSearchQuery)
            artistSearchResults = results
                .filter(artist =>
                    selectedGenres.length > 0
                        ? artist.item.musicalGenres.some(genre =>
                              selectedGenresNames.includes(genre.name),
                          )
                        : true,
                )
                .map(result => result.item)
        } else {
            artistSearchResults = initialData.filter(artist =>
                selectedGenres.length > 0
                    ? artist.musicalGenres.some(genre =>
                          selectedGenresNames.includes(genre.name),
                      )
                    : true,
            )
        }

        // Search tablatures
        let tablatureSearchResults: ArtistWithTablaturesAndContents[] = []
        if (debouncedSearchQuery && debouncedSearchQuery.length > 0) {
            const results = fuseTablatures.search(debouncedSearchQuery)
            tablatureSearchResults = results
                .filter(artist =>
                    selectedGenres.length > 0
                        ? artist.item.tablatures[0].musicalGenres.some(genre =>
                              selectedGenresNames.includes(genre.name),
                          )
                        : true,
                )
                .map(result => result.item)
        } else {
            tablatureSearchResults = processedData.tablatureSearchData.filter(
                artist =>
                    selectedGenres.length > 0
                        ? artist.tablatures[0].musicalGenres.some(genre =>
                              selectedGenresNames.includes(genre.name),
                          )
                        : true,
            )
        }

        // Search methods
        let methodSearchResults: MethodSummary[] = []
        if (debouncedSearchQuery && debouncedSearchQuery.length > 0) {
            methodSearchResults = fuseMethods
                .search(debouncedSearchQuery)
                .filter(method =>
                    selectedGenres.length > 0
                        ? method.item.musicalGenres.some(genre =>
                              selectedGenresNames.includes(genre.name),
                          )
                        : true,
                )
                .map(result => result.item)
        } else {
            methodSearchResults = methods.filter(method =>
                selectedGenres.length > 0
                    ? method.musicalGenres.some(genre =>
                          selectedGenresNames.includes(genre.name),
                      )
                    : true,
            )
        }

        setArtistResults(artistSearchResults)
        setTablatureResults(tablatureSearchResults)
        setMethodResults(methodSearchResults)
        setIsLoading(false)
    }, [
        debouncedSearchQuery,
        fuseArtist,
        fuseTablatures,
        fuseMethods,
        selectedGenres,
        initialData,
        methods,
        processedData.tablatureSearchData,
    ])

    const handleGenreSelect = (genre: MusicalGenre) => {
        setSelectedGenres([...selectedGenres, genre])
    }

    const handleGenreRemove = (genre: MusicalGenre) => {
        setSelectedGenres(selectedGenres.filter(g => g !== genre))
    }

    const currentResults =
        activeTab === 'artists' ? artistResults : tablatureResults
    const showEmptyState =
        activeTab !== 'genres' &&
        (activeTab === 'methods'
            ? methodResults.length === 0
            : !currentResults || currentResults.length === 0)

    // Collect image sources for preloading
    const imageSources = useMemo(() => {
        const sources: string[] = []
        currentResults.forEach(artist => {
            if (artist.contents?.[0]?.url) {
                sources.push(artist.contents[0].url)
            }
        })
        return sources
    }, [currentResults])

    // Use the image preload hook
    useImagePreload(imageSources, {
        enabled: !isLoading && currentResults.length > 0,
        priority: true,
        batchSize: 12,
    })

    return (
        <div className='flex flex-col items-center justify-center w-full gap-6 px-4 pt-10 lg:items-start xl:px-10'>
            {/* Search Input */}
            <div className='w-[90%] flex flex-col justify-center lg:justify-start items-center gap-6 z-10'>
                <SearchInput
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>

            {/* Genre Filters - Currently commented out in original */}
            {/* <GenreFilters
                availableGenres={genres}
                selectedGenres={selectedGenres}
                onGenreSelect={handleGenreSelect}
                onGenreRemove={handleGenreRemove}
            /> */}

            {/* Tabs and Results */}
            <div className='w-full max-w-[1400px] mt-8'>
                {/* Tabs */}
                <div className='flex justify-center lg:justify-start mb-6 gap-1'>
                    <TabButton
                        active={activeTab === 'tablatures'}
                        onClick={() => setActiveTab('tablatures')}
                        count={tablatureResults.length}
                    >
                        Tablatures
                    </TabButton>
                    <TabButton
                        active={activeTab === 'artists'}
                        onClick={() => setActiveTab('artists')}
                        count={artistResults.length}
                    >
                        Artists
                    </TabButton>
                    <TabButton
                        active={activeTab === 'genres'}
                        onClick={() => setActiveTab('genres')}
                        count={genreSummaries.length}
                    >
                        Genres
                    </TabButton>
                    <TabButton
                        active={activeTab === 'methods'}
                        onClick={() => setActiveTab('methods')}
                        count={methodResults.length}
                    >
                        Methods
                    </TabButton>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className='mt-14'>Loading...</div>
                ) : (
                    <div className='w-full'>
                        {showEmptyState && (
                            <div className='flex flex-col gap-4'>
                                <Alert
                                    className='text-left'
                                    message={`Sorry, we haven't found any ${activeTab} with name "${debouncedSearchQuery}"`}
                                />
                                <Alert
                                    className='bg-green-darkcyan'
                                    message={`Feel free to contact me for an estimation for a transcription or an arrangement to m.lelong.music@gmail.com.`}
                                />
                            </div>
                        )}
                        {/* Les trois panneaux restent dans le DOM (inactifs masqués en
                            CSS) pour que les liens artistes/tablatures/genres soient
                            tous présents dans le HTML servi (maillage interne SEO). */}
                        <div
                            className={cn(
                                'grid gap-6 grid-cols-1 md:grid-cols-2',
                                activeTab !== 'artists' && 'hidden',
                            )}
                        >
                            {artistResults.map((artist, index) => (
                                <ArtistCard
                                    key={artist.id}
                                    artist={artist}
                                    index={index}
                                />
                            ))}
                        </div>
                        <div
                            className={cn(
                                'grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                                activeTab !== 'tablatures' && 'hidden',
                            )}
                        >
                            {tablatureResults.map((artist, artistIndex) =>
                                artist.tablatures.map((tab, tabIndex) => (
                                    <TablatureCard
                                        key={`${artist.id}-${tab.id}`}
                                        tablature={tab}
                                        artist={artist}
                                        index={
                                            artistIndex *
                                                artist.tablatures.length +
                                            tabIndex
                                        }
                                    />
                                )),
                            )}
                        </div>
                        <div
                            className={cn(
                                'grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                                activeTab !== 'genres' && 'hidden',
                            )}
                        >
                            {genreSummaries.map(genre => (
                                <GenreCard key={genre.id} genre={genre} />
                            ))}
                        </div>
                        <div
                            className={cn(
                                'grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                                activeTab !== 'methods' && 'hidden',
                            )}
                        >
                            {methodResults.map((method, index) => (
                                <MethodCard
                                    key={method.id}
                                    method={method}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
