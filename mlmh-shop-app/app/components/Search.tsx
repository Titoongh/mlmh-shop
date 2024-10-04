'use client'
import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import { ArtistWithTablatures, SearchProps } from '../types/types'
import Input from './Input'
import { ArtistCTA, ArtistHeader, ArtistTablatures } from './ArtistViews'

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

export default function SearchResults({ initialData }: SearchProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] =
        useState<ArtistWithTablatures[]>(initialData)
    const [fuse, setFuse] = useState<Fuse<ArtistWithTablatures>>(
        new Fuse([], { keys: ['name'] }),
    )

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay

    useEffect(() => {
        const fuseOptions = {
            keys: ['name', 'tablatures.name'],
            threshold: 0.4,
        }
        const fuse = new Fuse(initialData, fuseOptions)
        setFuse(fuse)
    }, [initialData])

    // Use the debounced search query for filtering
    useEffect(() => {
        if (fuse && debouncedSearchQuery && debouncedSearchQuery.length > 0) {
            const results = fuse.search(debouncedSearchQuery)
            setSearchResults(results.map(result => result.item))
        } else {
            setSearchResults(initialData)
        }
    }, [debouncedSearchQuery, fuse, setSearchResults, initialData])

    useEffect(() => {
        console.log('searchResults', searchResults)
    }, [searchResults])

    return (
        <div className='w-full flex flex-col items-center justify-center gap-10 px-8 xl:px-10 pt-10'>
            <div className='w-full flex justify-center items-center'>
                <Input
                    placeholder='Search artists or tablatures...'
                    value={searchQuery}
                    setValue={setSearchQuery}
                    className='w-[50vw] min-w-[300px] max-w-[600px]'
                />
            </div>
            <div className='flex flex-col justify-center items-center gap-20 w-full pt-10'>
                {searchResults.map((item: ArtistWithTablatures) => (
                    <div
                        key={`${item.id}`}
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
                                className='hidden lg:grid'
                            />
                            <ArtistTablatures
                                tablatures={item.tablatures.slice(0, 4)}
                                artistId={item.id}
                                className='lg:hidden'
                            />
                        </div>

                        <div className='min-w-[200px] flex items-center justify-center'>
                            <ArtistCTA id={item.id} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
