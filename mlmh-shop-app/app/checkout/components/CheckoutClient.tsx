'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/app/hooks/useCart'
import CheckoutTable from './CheckoutTable'
import CheckoutSuccessView from './CheckoutSuccessView'
import { TablatureWithArtist } from '@/app/types/types'
import Link from 'next/link'

interface CheckoutClientProps {
    isSuccess: boolean
    sessionId: string | null
    isCanceled?: boolean
}

const fetchTablatures = async (
    ids: string[],
): Promise<TablatureWithArtist[]> => {
    if (ids.length === 0) return []

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/tablatures/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
    })

    if (!response.ok) {
        throw new Error('Failed to fetch tablatures')
    }

    return response.json()
}

export default function CheckoutClient({
    isSuccess,
    sessionId,
    isCanceled,
}: CheckoutClientProps) {
    const [tablatures, setTablatures] = useState<TablatureWithArtist[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getItems, emptyCart } = useCart()

    useEffect(() => {
        const initializeCart = async () => {
            if (isSuccess && sessionId) {
                // Clear cart on successful payment
                emptyCart()
                setTablatures([])
                setIsLoading(false)
                return
            }

            try {
                const cartItems = getItems()
                const itemIds = cartItems.map(item => item.id)

                if (itemIds.length > 0) {
                    const fetchedTablatures = await fetchTablatures(itemIds)
                    setTablatures(fetchedTablatures)
                } else {
                    setTablatures([])
                }
            } catch (error) {
                console.error('Error fetching tablatures:', error)
                setTablatures([])
            } finally {
                setIsLoading(false)
            }
        }

        initializeCart()
    }, [isSuccess, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <div className='w-full max-w-[1000px]'>
                {/* Responsive loading skeleton that matches table structure */}
                <div className='bg-white rounded-lg shadow-sm border-2 border-black overflow-hidden'>
                    {/* Table Header */}
                    <div className='h-[100px] px-4 lg:px-6 border-b border-black bg-white flex items-center'>
                        <div className='flex justify-between items-center w-full'>
                            <div className='h-8 bg-gray-200 animate-pulse rounded w-20 sm:w-32'></div>
                            <div className='h-6 bg-gray-200 animate-pulse rounded w-16 sm:w-20 border border-black'></div>
                        </div>
                    </div>

                    {/* Loading rows - responsive */}
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className='px-4 lg:px-6 py-6 border-b border-gray-100 last:border-b-0'
                        >
                            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0'>
                                <div className='flex-1 w-full sm:max-w-[250px] lg:max-w-[1000px]'>
                                    <div className='h-5 bg-gray-200 animate-pulse rounded w-full sm:w-3/4 mb-2'></div>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-1/2 sm:w-1/4 mb-2'></div>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-20'></div>
                                </div>
                                <div className='w-full sm:w-auto flex justify-center'>
                                    <div className='h-6 bg-gray-200 animate-pulse rounded w-16 border border-black'></div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Footer */}
                    <div className='px-4 lg:px-6 py-4 bg-gray-50 border-t border-black'>
                        <div className='flex justify-between items-center'>
                            <div className='h-6 bg-gray-200 animate-pulse rounded w-12'></div>
                            <div className='h-8 bg-gray-200 animate-pulse rounded w-16'></div>
                        </div>
                    </div>
                </div>

                {/* Button skeleton - responsive */}
                <div className='flex justify-end mt-6 w-full'>
                    <div className='h-12 bg-gray-200 animate-pulse rounded w-full sm:w-48'></div>
                </div>
            </div>
        )
    }

    if (isSuccess && sessionId) {
        return <CheckoutSuccessView sessionId={sessionId} />
    }

    if (isCanceled) {
        return (
            <div className='w-full max-w-2xl'>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
                    <div className='flex items-center mb-4'>
                        <svg
                            className='w-8 h-8 text-yellow-600 mr-3'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                            />
                        </svg>
                        <h2 className='text-xl font-semibold text-yellow-800'>
                            Payment Canceled
                        </h2>
                    </div>
                    <p className='text-yellow-700 mb-4'>
                        Your payment was canceled. Your cart has been preserved
                        and you can try again when ready.
                    </p>
                    <Link
                        href='/checkout'
                        className='bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors'
                    >
                        Return to Cart
                    </Link>
                </div>
            </div>
        )
    }

    return <CheckoutTable initialTablatures={tablatures} />
}
