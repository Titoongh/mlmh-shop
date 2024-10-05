'use client'
import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import {
    ArtistWithTablatures,
    SearchFilterEnum,
    SearchProps,
} from '../types/types'
import Input from './Input'
import { ArtistCTA, ArtistHeader, ArtistTablatures } from './ArtistViews'
import { Tablature } from '@prisma/client'
import Select from './Select'
import Alert from './Alert'

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
        useState<ArtistWithTablatures[]>(initialData)
    const [fuseArtist, setFuseArtist] = useState<Fuse<ArtistWithTablatures>>(
        new Fuse([], { keys: ['name'] }),
    )
    const [fuseTabs, setFuseTabs] = useState<Fuse<ArtistWithTablatures>>(
        new Fuse([], { keys: ['tablatures.title'] }),
    )
    const [searchFilter, setSearchFilter] = useState<SearchFilterEnum>(
        SearchFilterEnum.ARTIST,
    )

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay

    useEffect(() => {
        const initialDataTablatures: ArtistWithTablatures[] =
            initialData.flatMap((artist: ArtistWithTablatures) => {
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
            setSearchResults(initialData)
        }
    }, [
        debouncedSearchQuery,
        fuseArtist,
        fuseTabs,
        setSearchResults,
        initialData,
        searchFilter,
    ])

    useEffect(() => {
        console.log('searchResults', searchResults)
    }, [searchResults])

    return (
        <div className='w-full flex flex-col items-center justify-center gap-10 px-4 xl:px-10 pt-10'>
            <div className='w-full flex justify-center items-center gap-6'>
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
            <div className='flex flex-col justify-center items-center gap-20 w-full pt-10'>
                {searchResults.length === 0 && (
                    <Alert
                        message={`Sorry, we didn't found any ${searchFilter.toLowerCase()} with name "${debouncedSearchQuery}"`}
                    />
                )}
                {searchResults.map(
                    (item: ArtistWithTablatures, index: number) => (
                        <div
                            key={`${item.id + String(index)}`}
                            className='w-full flex flex-col gap-6 xl:flex-row text-base justify-start'
                        >
                            <div className='min-w-[200px] flex justify-center lg:justify-center items-center '>
                                <ArtistHeader
                                    name={item.name}
                                    picture={item.picture}
                                />
                            </div>
                            <div className='w-full flex justify-center items-center'>
                                <ArtistTablatures
                                    tablatures={item.tablatures.slice(0, 3)}
                                    artistId={item.id}
                                />
                            </div>
                            <div className='min-w-[200px] flex items-center justify-center'>
                                <ArtistCTA id={item.id} />
                            </div>
                        </div>
                    ),
                )}
            </div>
        </div>
    )
}
