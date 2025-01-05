'use client'
import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import {
    ArtistWithTablaturesAndContents,
    SearchFilterEnum,
    SearchProps,
} from '../types/types'
import Input from './Input'
import {
    ArtistCard,
    TablatureCard,
    ArtistCTA,
    ArtistHeader,
    ArtistTablatures,
} from './ArtistViews'
import { MusicalGenre, Tablature } from '@prisma/client'
import Select from './Select'
import Alert from './Alert'
import { cn } from '@/lib/utils'
import { Tag } from './Buttons'
import { filter } from 'jszip'

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

const FilterTab = (props: {
    searchFilter: SearchFilterEnum
    setSearchFilter: (value: SearchFilterEnum) => void
    setIsLoading: (value: boolean) => void
}) => {
    return (
        <Select
            items={[SearchFilterEnum.ARTIST, SearchFilterEnum.TABLATURE]}
            selectedItem={props.searchFilter}
            setSelectedItem={props.setSearchFilter}
            setIsLoading={props.setIsLoading}
        />
    )
}
export default function SearchResults({ initialData, genres }: SearchProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] =
        useState<ArtistWithTablaturesAndContents[]>(initialData)
    const [fuseArtist, setFuseArtist] = useState<
        Fuse<ArtistWithTablaturesAndContents>
    >(new Fuse([], { keys: ['name'] }))
    const [fuseTabs, setFuseTabs] = useState<
        Fuse<ArtistWithTablaturesAndContents>
    >(new Fuse([], { keys: ['tablatures.title'] }))
    const [searchFilter, setSearchFilter] = useState<SearchFilterEnum>(
        SearchFilterEnum.ARTIST,
    )
    const [isLoading, setIsLoading] = useState(true)
    const [selectedGenres, setSelectedGenres] = useState<MusicalGenre[]>([])
    const [availableGenres, setAvailableGenres] =
        useState<MusicalGenre[]>(genres)

    const initialDataTablatures: ArtistWithTablaturesAndContents[] =
        initialData.flatMap((artist: ArtistWithTablaturesAndContents) => {
            return artist.tablatures.map(t => {
                return {
                    ...artist,
                    tablatures: [t],
                }
            })
        })

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay

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
    }, [initialData])

    // Use the debounced search query for filtering
    useEffect(() => {
        setIsLoading(true)
        const selectedGenresNames = selectedGenres.map(genre => genre.name)
        if (
            searchFilter === SearchFilterEnum.ARTIST &&
            fuseArtist &&
            debouncedSearchQuery &&
            debouncedSearchQuery.length > 0
        ) {
            let results = fuseArtist.search(debouncedSearchQuery)
            // filter out using the musical genres filters
            results = results.filter(artist =>
                selectedGenres.length > 0
                    ? artist.item.musicalGenres.some(genre =>
                          selectedGenresNames.includes(genre.name),
                      )
                    : true,
            )
            setSearchResults(results.map(result => result.item))
        } else if (
            searchFilter === SearchFilterEnum.TABLATURE &&
            fuseTabs &&
            debouncedSearchQuery &&
            debouncedSearchQuery.length > 0
        ) {
            let results = fuseTabs.search(debouncedSearchQuery)
            results = results.filter(artist =>
                selectedGenres.length > 0
                    ? artist.item.tablatures[0].musicalGenres.some(genre =>
                          selectedGenresNames.includes(genre.name),
                      )
                    : true,
            )
            setSearchResults(results.map(result => result.item))
        } else {
            if (initialData) {
                let filteredResults: ArtistWithTablaturesAndContents[] =
                    initialData
                if (filteredResults) {
                    if (searchFilter === SearchFilterEnum.ARTIST) {
                        if (selectedGenres.length > 0) {
                            filteredResults = filteredResults.filter(artist =>
                                artist.musicalGenres.some(genre =>
                                    selectedGenresNames.includes(genre.name),
                                ),
                            )
                        }
                    } else {
                        filteredResults = initialDataTablatures
                        if (selectedGenres.length > 0) {
                            filteredResults = filteredResults.filter(
                                artist =>
                                    artist.tablatures.length > 0 &&
                                    artist.tablatures[0].musicalGenres.some(
                                        genre =>
                                            selectedGenresNames.includes(
                                                genre.name,
                                            ),
                                    ),
                            )
                        }
                    }
                }
                setSearchResults(filteredResults)
            }
        }
        setIsLoading(false)
    }, [
        debouncedSearchQuery,
        fuseArtist,
        fuseTabs,
        selectedGenres,
        setSearchResults,
        initialData,
        searchFilter,
    ])

    const handleGenreSelect = (genre: MusicalGenre) => {
        setSelectedGenres([...selectedGenres, genre])
    }

    const handleGenreRemove = (genre: MusicalGenre) => {
        setSelectedGenres(selectedGenres.filter(g => g !== genre))
    }

    return (
        <div className='flex flex-col items-center justify-center w-full gap-6 px-4 pt-10 lg:items-start xl:px-10'>
            <div className='w-[90%] flex flex-col justify-center lg:justify-start items-center lg:flex-row gap-6 z-10'>
                <Input
                    placeholder='Search artists or tablatures...'
                    value={searchQuery}
                    setValue={setSearchQuery}
                    className='w-[50vw] min-w-[300px] max-w-[600px]'
                />
                <FilterTab
                    setSearchFilter={setSearchFilter}
                    searchFilter={searchFilter}
                    setIsLoading={setIsLoading}
                />
            </div>
            <div className='w-[90%] flex flex-row gap-4 justify-center lg:justify-start'>
                <GenreFilters
                    availableGenres={availableGenres}
                    selectedGenres={selectedGenres}
                    onGenreSelect={handleGenreSelect}
                    removeGenre={handleGenreRemove}
                />
            </div>
            {isLoading ? (
                <div className='mt-14'>Loading...</div>
            ) : (
                <div className='w-full max-w-[1400px] mt-14'>
                    {!searchResults || searchResults.length === 0 ? (
                        <div className='flex flex-col gap-4'>
                            <Alert
                                className='text-left'
                                message={`Sorry, we haven't found any ${searchFilter.toLowerCase()} with name "${debouncedSearchQuery}"`}
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
                                searchFilter === SearchFilterEnum.ARTIST
                                    ? 'grid-cols-1 md:grid-cols-2'
                                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                            )}
                        >
                            {searchFilter === SearchFilterEnum.ARTIST
                                ? searchResults.map(artist => (
                                      <ArtistCard
                                          key={artist.id}
                                          artist={artist}
                                      />
                                  ))
                                : searchResults.flatMap(artist =>
                                      artist.tablatures.map(tab => (
                                          <TablatureCard
                                              key={`${artist.id}-${tab.id}`}
                                              tablature={tab}
                                              artist={artist}
                                          />
                                      )),
                                  )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
