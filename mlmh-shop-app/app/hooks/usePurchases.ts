'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export function usePurchases() {
    const { isSignedIn } = useAuth()
    const [purchasedTablatures, setPurchasedTablatures] = useState<string[]>([])
    const [purchasedMethodOffers, setPurchasedMethodOffers] = useState<
        string[]
    >([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isSignedIn === undefined || !isSignedIn) {
            setPurchasedTablatures([])
            setPurchasedMethodOffers([])
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
                setPurchasedMethodOffers(data.purchasedMethodOffers || [])
            } catch (err) {
                console.error('Error fetching purchases:', err)
                setError('Failed to load purchase history')
                setPurchasedTablatures([])
                setPurchasedMethodOffers([])
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

    const hasPurchasedOffer = (methodOfferId: string): boolean => {
        if (!Array.isArray(purchasedMethodOffers)) {
            return false
        }
        return purchasedMethodOffers.includes(methodOfferId)
    }

    return {
        purchasedTablatures,
        purchasedMethodOffers,
        isLoading,
        error,
        hasPurchased,
        hasPurchasedOffer,
    }
}