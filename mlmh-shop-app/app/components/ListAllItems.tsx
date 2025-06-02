'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ArtistTab {
    name: string
    id: string
}

interface Item {
    id: string
    name: string
    title: string
    artists: ArtistTab[]
    hidden: boolean
}

interface ListAllItemsProps {
    type: 'artists' | 'tablatures'
}

export default function ListAllItems({ type }: ListAllItemsProps) {
    const [items, setItems] = useState<Item[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const baseUrl =
                    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                const response = await fetch(`${baseUrl}/api/${type}/names`)
                if (response.ok) {
                    const data = await response.json()
                    console.log('reposne', data)
                    setItems(data)
                }
            } catch (error) {
                console.error(`Error fetching ${type}:`, error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchItems()
    }, [type]) // Add type as dependency

    const filteredItems = items.filter(item => {
        if (searchQuery.length > 0) {
            if (type === 'artists') {
                return item.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            } else {
                return item.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            }
        }
        return true
    })

    if (isLoading) {
        return <div className='p-4'>Loading...</div>
    }

    return (
        <div className='w-full max-w-2xl mx-auto p-4'>
            <input
                type='text'
                placeholder={`Search ${type}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full p-2 mb-4 border-2 border-black rounded'
            />

            <div className='space-y-2'>
                {filteredItems.map(item => (
                    <Link
                        key={item.id}
                        href={
                            type == 'artists'
                                ? `/${type}/${item.id}`
                                : `/product/${type}/${item.id}`
                        }
                        className={`block p-2 ${
                            item.hidden
                                ? 'hover:bg-gray-100'
                                : 'hover:bg-gray-300'
                        } rounded transition-colors`}
                    >
                        <div className='flex w-full justify-between'>
                            <span>
                                {type === 'artists' ? item.name : item.title}
                            </span>

                            <span className='text-red-salmon'>
                                {item.hidden && 'hidden'}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <p className='text-gray-500 text-center'>
                    No {type} found matching &quot;{searchQuery}&quot;
                </p>
            )}
        </div>
    )
}
