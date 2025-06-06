'use client'
import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import {
    ArtistWithTablaturesAndContents,
    SearchFilterEnum,
    SearchProps,
} from '../types/types'
import Input from './Input'
import { ArtistCard, TablatureCard } from './ArtistViews'
import { MusicalGenre } from '@prisma/client'
import Alert from './Alert'
import { cn } from '@/lib/utils'
import { Tag } from './Buttons'
import { imageService } from '../services/imageService'
import { useImagePreload } from '../hooks/useImagePreload'

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

const GenreFilters = ({
    availableGenres,
    selectedGenres,
    onGenreSelect,
    removeGenre,
}: {
    availableGenres: MusicalGenre[]
    selectedGenres: MusicalGenre[]
    onGenreSelect: (genre: MusicalGenre) => void
    removeGenre: (genre: MusicalGenre) => void
}) => {
    return (
        <div className='flex justify-center'>
            <div className='w-[50vw] min-w-[300px] max-w-[600px] flex flex-row gap-2 flex-wrap'>
                {selectedGenres.map(genre => (
                    <Tag
                        key={genre.id}
                        color='green'
                        onClick={() => removeGenre(genre)}
                    >
                        <div className='flex items-center gap-2'>
                            {genre.name}
                            <span className='text-sm'>×</span>
                        </div>
                    </Tag>
                ))}
                {availableGenres
                    .filter(genre => !selectedGenres.includes(genre))
                    .map(genre => (
                        <Tag
                            key={genre.id}
                            color='default'
                            onClick={() => onGenreSelect(genre)}
                        >
                            {genre.name}
                        </Tag>
                    ))}
            </div>
        </div>
    )
}

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

export default function TabbedSearchResults({
    initialData,
    genres,
    initialSearchQuery = '',
}: SearchProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
    const [activeTab, setActiveTab] = useState<'tablatures' | 'artists'>(
        'tablatures',
    )
    const [artistResults, setArtistResults] =
        useState<ArtistWithTablaturesAndContents[]>(initialData)
    const [tablatureResults, setTablatureResults] = useState<
        ArtistWithTablaturesAndContents[]
    >([])
    const [fuseArtist, setFuseArtist] = useState<
        Fuse<ArtistWithTablaturesAndContents>
    >(new Fuse([], { keys: ['name'] }))
    const [fuseTabs, setFuseTabs] = useState<
        Fuse<ArtistWithTablaturesAndContents>
    >(new Fuse([], { keys: ['tablatures.title'] }))
    const [isLoading, setIsLoading] = useState(true)
    const [selectedGenres, setSelectedGenres] = useState<MusicalGenre[]>([])
    const [availableGenres, setAvailableGenres] =
        useState<MusicalGenre[]>(genres)

    // Memoize initialDataTablatures to prevent infinite re-renders
    const initialDataTablatures = useMemo(
        () =>
            initialData.flatMap((artist: ArtistWithTablaturesAndContents) => {
                return artist.tablatures.map(t => {
                    return {
                        ...artist,
                        tablatures: [t],
                    }
                })
            }),
        [initialData],
    )

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    useEffect(() => {
        const fuseOptionsArtist = {
            keys: ['name'],
            threshold: 0.4,
        }
        const fuseOptionsTabs = {
            keys: ['tablatures.title'],
            threshold: 0.4,
        }
        const fuseArtist = new Fuse(initialData, fuseOptionsArtist)
        const fuseTabs = new Fuse(initialDataTablatures, fuseOptionsTabs)
        setFuseArtist(fuseArtist)
        setFuseTabs(fuseTabs)
    }, [initialData, initialDataTablatures])

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
            const results = fuseTabs.search(debouncedSearchQuery)
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
            tablatureSearchResults = initialDataTablatures.filter(artist =>
                selectedGenres.length > 0
                    ? artist.tablatures[0].musicalGenres.some(genre =>
                          selectedGenresNames.includes(genre.name),
                      )
                    : true,
            )
        }

        setArtistResults(artistSearchResults)
        setTablatureResults(tablatureSearchResults)
        setIsLoading(false)
    }, [
        debouncedSearchQuery,
        fuseArtist,
        fuseTabs,
        selectedGenres,
        initialData,
        initialDataTablatures,
    ])

    const handleGenreSelect = (genre: MusicalGenre) => {
        setSelectedGenres([...selectedGenres, genre])
    }

    const handleGenreRemove = (genre: MusicalGenre) => {
        setSelectedGenres(selectedGenres.filter(g => g !== genre))
    }

    const currentResults =
        activeTab === 'artists' ? artistResults : tablatureResults
    const currentCount = currentResults.length

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
                <Input
                    placeholder='Search artists or tablatures...'
                    value={searchQuery}
                    setValue={setSearchQuery}
                    className='w-[50vw] min-w-[300px] max-w-[600px]'
                />
            </div>

            {/* Genre Filters */}
            {/* <div className='w-[90%] flex flex-row gap-4 justify-center lg:justify-start'>
                <GenreFilters
                    availableGenres={availableGenres}
                    selectedGenres={selectedGenres}
                    onGenreSelect={handleGenreSelect}
                    removeGenre={handleGenreRemove}
                />
            </div> */}

            {/* Tabs */}
            <div className='w-full max-w-[1400px] mt-8'>
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
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className='mt-14'>Loading...</div>
                ) : (
                    <div className='w-full'>
                        {!currentResults || currentResults.length === 0 ? (
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
                        ) : (
                            <div
                                className={cn(
                                    'grid gap-6',
                                    activeTab === 'artists'
                                        ? 'grid-cols-1 md:grid-cols-2'
                                        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                                )}
                            >
                                {activeTab === 'artists'
                                    ? currentResults.map((artist, index) => (
                                          <ArtistCard
                                              key={artist.id}
                                              artist={artist}
                                              index={index}
                                          />
                                      ))
                                    : currentResults.map(
                                          (artist, artistIndex) =>
                                              artist.tablatures.map(
                                                  (tab, tabIndex) => (
                                                      <TablatureCard
                                                          key={`${artist.id}-${tab.id}`}
                                                          tablature={tab}
                                                          artist={artist}
                                                          index={
                                                              artistIndex *
                                                                  artist
                                                                      .tablatures
                                                                      .length +
                                                              tabIndex
                                                          }
                                                      />
                                                  ),
                                              ),
                                      )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
