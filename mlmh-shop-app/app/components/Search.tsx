'use client'
import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import { SearchItem, SearchProps } from '../types/types'
import Image from 'next/image'
import Input from './components/Input'

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
    const [searchResults, setSearchResults] = useState<SearchItem[]>([])
    const [fuse, setFuse] = useState<Fuse<SearchItem>>(
        new Fuse([], { keys: ['name'] }),
    )

    // Debounce the search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay

    useEffect(() => {
        const searchData: SearchItem[] = initialData.flatMap(artist => [
            {
                type: 'artist',
                id: artist.id,
                name: artist.name,
                image: artist.picture,
            } satisfies SearchItem,
            // ...artist?.tablatures?.map(
            //     tab =>
            //         ({
            //             type: 'tablature',
            //             id: tab.id,
            //             name: tab.title,
            //         }) satisfies SearchItem,
            // ),
        ])
        const fuseOptions = {
            keys: ['name'],
            threshold: 0.4,
        }
        const fuse = new Fuse(searchData, fuseOptions)

        setFuse(fuse)
    }, [initialData])

    // Use the debounced search query for filtering
    useEffect(() => {
        if (fuse && debouncedSearchQuery) {
            const results = fuse.search(debouncedSearchQuery)
            setSearchResults(results.map(result => result.item))
        } else {
            setSearchResults([])
        }
    }, [debouncedSearchQuery, fuse])

    return (
        <div>
            <Input
                placeholder='Search artists or tablatures...'
                value={searchQuery}
                setValue={setSearchQuery}
                className='w-[50vw] min-w-[300px] max-w-[600px]'
            />
            <ul>
                {searchResults.map((item: SearchItem) => (
                    <li key={`${item.type}-${item.id}`}>
                        {item.type === 'artist' ? (
                            <div>
                                <strong>{item.name}</strong>
                                {item.image && (
                                    <Image
                                        src={'/portrait.jpeg'}
                                        alt={item.name}
                                        width={50}
                                        height={50}
                                    />
                                )}
                            </div>
                        ) : (
                            `${item.name})`
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
