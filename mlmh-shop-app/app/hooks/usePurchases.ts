'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export function usePurchases() {
    const { isSignedIn } = useAuth()
    const [purchasedTablatures, setPurchasedTablatures] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isSignedIn === undefined || !isSignedIn) {
            setPurchasedTablatures([])
            return
        }

        const fetchPurchases = async () => {
            setIsLoading(true)
            setError(null)
            
            try {
                const response = await fetch('/api/user/purchases')
                
                if (!response.ok) {
                    throw new Error('Failed to fetch purchases')
                }
                
                const data = await response.json()
                setPurchasedTablatures(data.purchasedTablatures || [])
            } catch (err) {
                console.error('Error fetching purchases:', err)
                setError('Failed to load purchase history')
                setPurchasedTablatures([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchPurchases()
    }, [isSignedIn])

    const hasPurchased = (tablatureId: string): boolean => {
        if (!Array.isArray(purchasedTablatures)) {
            return false
        }
        return purchasedTablatures.includes(tablatureId)
    }

    return {
        purchasedTablatures,
        isLoading,
        error,
        hasPurchased,
    }
}