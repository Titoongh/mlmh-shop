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
import { Tablature } from '@prisma/client'
import Select from './Select'
import Alert from './Alert'
import { cn } from '@/lib/utils'

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
}) => {
    return (
        <Select
            items={[SearchFilterEnum.ARTIST, SearchFilterEnum.TABLATURE]}
            setSelectedItem={props.setSearchFilter}
            selectedItem={props.searchFilter}
        />
    )
}
export default function SearchResults({ initialData }: SearchProps) {
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

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay

    useEffect(() => {
        const initialDataTablatures: ArtistWithTablaturesAndContents[] =
            initialData.flatMap((artist: ArtistWithTablaturesAndContents) => {
                return artist.tablatures.map(t => {
                    return {
                        ...artist,
                        tablatures: [t],
                    }
                })
            })
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
        if (
            searchFilter === SearchFilterEnum.ARTIST &&
            fuseArtist &&
            debouncedSearchQuery &&
            debouncedSearchQuery.length > 0
        ) {
            const results = fuseArtist.search(debouncedSearchQuery)
            setSearchResults(results.map(result => result.item))
        } else if (
            searchFilter === SearchFilterEnum.TABLATURE &&
            fuseTabs &&
            debouncedSearchQuery &&
            debouncedSearchQuery.length > 0
        ) {
            const results = fuseTabs.search(debouncedSearchQuery)
            setSearchResults(results.map(result => result.item))
        } else {
            if (initialData) {
                setSearchResults(initialData)
                setIsLoading(false)
            }
        }
    }, [
        debouncedSearchQuery,
        fuseArtist,
        fuseTabs,
        setSearchResults,
        initialData,
        searchFilter,
    ])
    return (
        <div className='w-full flex flex-col items-center justify-center gap-10 px-4 xl:px-10 pt-10'>
            <div className='w-[90%] flex flex-col justify-center items-center lg:flex-row gap-6 z-10'>
                <Input
                    placeholder='Search artists or tablatures...'
                    value={searchQuery}
                    setValue={setSearchQuery}
                    className='w-[50vw] min-w-[300px] max-w-[600px]'
                />
                <FilterTab
                    setSearchFilter={setSearchFilter}
                    searchFilter={searchFilter}
                />
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className='w-full max-w-[1400px]'>
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
