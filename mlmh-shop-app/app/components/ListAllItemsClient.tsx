'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ListAllItemsClientProps } from './ListAllItems.types'
import { isArtistItem, isTablatureItem } from './ListAllItems.types'

export default function ListAllItemsClient({
    type,
    initialItems,
}: ListAllItemsClientProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredItems = initialItems.filter(item => {
        if (searchQuery.length > 0) {
            if (type === 'artists' && isArtistItem(item)) {
                return item.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            } else if (type === 'tablatures' && isTablatureItem(item)) {
                return item.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            }
        }
        return true
    })

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
                {filteredItems.map(item => {
                    const displayName = isArtistItem(item)
                        ? item.name
                        : item.title
                    const href =
                        type === 'artists'
                            ? `/${type}/${item.id}`
                            : `/product/${type}/${item.id}`

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            className={`block p-2 ${
                                item.hidden
                                    ? 'hover:bg-gray-100'
                                    : 'hover:bg-gray-300'
                            } rounded transition-colors`}
                        >
                            <div className='flex w-full justify-between'>
                                <span>{displayName}</span>
                                <span className='text-red-salmon'>
                                    {item.hidden && 'hidden'}
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {filteredItems.length === 0 && (
                <p className='text-gray-500 text-center'>
                    No {type} found matching &quot;{searchQuery}&quot;
                </p>
            )}
        </div>
    )
}
