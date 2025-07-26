'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCart } from '@/app/hooks/useCart'
import CheckoutTable from './CheckoutTable'
import CheckoutSuccessView from './CheckoutSuccessView'
import { CheckoutPageData } from '../lib/checkout-data'
import { TablatureWithArtist } from '@/app/types/types'

interface CheckoutContentProps {
    initialData: CheckoutPageData
    isSuccess: boolean
    sessionId: string | null
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

export default function CheckoutContent({
    initialData,
    isSuccess,
    sessionId,
}: CheckoutContentProps) {
    const [isInitialized, setIsInitialized] = useState(false)
    const [tablatures, setTablatures] = useState<TablatureWithArtist[]>([])
    const { getItems, emptyCart } = useCart()

    const loadCartData = useCallback(async () => {
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
        }
    }, [getItems])

    useEffect(() => {
        const initializeComponent = async () => {
            if (isSuccess && sessionId) {
                // Clear cart on successful payment
                emptyCart()
                setTablatures([])
            } else {
                // Load current cart items
                await loadCartData()
            }
            setIsInitialized(true)
        }

        initializeComponent()
    }, [isSuccess, sessionId, emptyCart, loadCartData])

    // Show loading until initialized
    if (!isInitialized) {
        return <div>Loading...</div>
    }

    if (isSuccess && sessionId) {
        return <CheckoutSuccessView sessionId={sessionId} />
    }

    return <CheckoutTable initialTablatures={tablatures} />
}
