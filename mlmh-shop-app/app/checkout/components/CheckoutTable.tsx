'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/app/components/ui/table'
import { DefaultButton } from '@/app/components/Buttons'
import { TablatureWithArtist } from '@/app/types/types'
import { useCart } from '@/app/hooks/useCart'
import { useAuth } from '@clerk/nextjs'
import { usePurchases } from '@/app/hooks/usePurchases'
import { useEffect } from 'react'
import Link from 'next/link'
import AuthPromptModal from './AuthPromptModal'

interface CheckoutTableProps {
    initialTablatures: TablatureWithArtist[]
}

export default function CheckoutTable({
    initialTablatures,
}: CheckoutTableProps) {
    const [tablatures, setTablatures] =
        useState<TablatureWithArtist[]>(initialTablatures)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [removedOwnedItems, setRemovedOwnedItems] = useState<string[]>([])
    const [showAuthModal, setShowAuthModal] = useState(false)
    const { removeItem, getItemById } = useCart()
    const { isSignedIn } = useAuth()
    const { hasPurchased, purchasedTablatures } = usePurchases()

    // Auto-remove owned items from cart when purchases are loaded
    useEffect(() => {
        if (purchasedTablatures.length > 0) {
            const ownedItems: string[] = []
            
            tablatures.forEach(tablature => {
                if (hasPurchased(tablature.id)) {
                    const item = getItemById(tablature.id)
                    if (item) {
                        removeItem(item)
                        ownedItems.push(tablature.title)
                    }
                }
            })
            
            if (ownedItems.length > 0) {
                setRemovedOwnedItems(ownedItems)
                // Update tablatures state to reflect removed items
                setTablatures(prev => prev.filter(tab => !hasPurchased(tab.id)))
            }
        }
    }, [purchasedTablatures, tablatures, hasPurchased, getItemById, removeItem])

    const handleRemove = (id: string) => {
        const item = getItemById(id)
        if (item) {
            removeItem(item)
        }
        setTablatures(prevTablatures => {
            return prevTablatures.filter(tab => tab.id !== id)
        })
    }

    const handleCheckout = async () => {
        setIsLoading(true)
        setError(null) // Clear any previous errors
        const tabIds = tablatures.map(tab => tab.id)
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        try {
            const response = await fetch(`${baseUrl}/api/checkout-v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderItems: { tablatureIds: tabIds } }),
            })

            if (response.ok) {
                const { url } = await response.json()
                window.location.href = url
            } else {
                // Parse error response from API
                const errorData = await response.json().catch(() => ({ 
                    error: 'An unexpected error occurred' 
                }))
                const errorMessage = errorData.error || 'Checkout failed. Please try again.'
                setError(errorMessage)
                console.error('Checkout failed:', errorData)
            }
        } catch (error) {
            console.error('Error during checkout:', error)
            setError('Network error. Please check your connection and try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const totalPrice = tablatures.reduce((acc, tab) => acc + tab.price, 0)

    return (
        <>
            <Table>
                <TableHeader className='h-[100px]'>
                    <TableRow>
                        <TableHead className='text-3xl'>My cart</TableHead>
                        <TableHead className='min-h-full border-[1px] border-black text-center'>
                            Amount
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tablatures.map(tab => (
                        <TableRow
                            key={tab.id}
                            className='text-lg tracking-normal'
                        >
                            <TableCell className='max-w-[250px] lg:max-w-[1000px] break-words py-6'>
                                <div className='flex flex-col items-start justify-start gap-2'>
                                    <div>
                                        <span className='font-bold'>
                                            {tab.title}
                                        </span>
                                        {' - '}
                                        {tab.artists[0].name}
                                    </div>
                                    <button
                                        className='text-sm underline'
                                        onClick={() => {
                                            handleRemove(tab.id)
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </TableCell>
                            <TableCell className='text-center text-2xl border-[1px] border-black'>
                                ${tab.price}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell className='text-xl text-right'>
                            Total:
                        </TableCell>
                        <TableCell className='text-xl text-center'>
                            <span className='text-2xl font-bold'>
                                ${totalPrice}
                            </span>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            
            {removedOwnedItems.length > 0 && (
                <div className='w-full mb-4'>
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <div className='flex items-start'>
                            <svg 
                                className='w-5 h-5 text-blue-600 mr-2 mt-0.5' 
                                fill='none' 
                                stroke='currentColor' 
                                viewBox='0 0 24 24'
                            >
                                <path 
                                    strokeLinecap='round' 
                                    strokeLinejoin='round' 
                                    strokeWidth={2} 
                                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
                                />
                            </svg>
                            <div className='flex-1'>
                                <h3 className='text-sm font-medium text-blue-800'>
                                    Items Already Owned
                                </h3>
                                <p className='text-sm text-blue-700 mt-1'>
                                    The following items were removed from your cart because you already own them: {removedOwnedItems.join(', ')}
                                </p>
                                <Link 
                                    href="/user/downloads"
                                    className='text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block'
                                >
                                    View your downloads →
                                </Link>
                            </div>
                            <button 
                                onClick={() => setRemovedOwnedItems([])}
                                className='text-blue-400 hover:text-blue-600'
                            >
                                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                    <path 
                                        fillRule='evenodd' 
                                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' 
                                        clipRule='evenodd' 
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {error && (
                <div className='w-full mb-4'>
                    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                        <div className='flex items-center'>
                            <svg 
                                className='w-5 h-5 text-red-600 mr-2' 
                                fill='none' 
                                stroke='currentColor' 
                                viewBox='0 0 24 24'
                            >
                                <path 
                                    strokeLinecap='round' 
                                    strokeLinejoin='round' 
                                    strokeWidth={2} 
                                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
                                />
                            </svg>
                            <div className='flex-1'>
                                <h3 className='text-sm font-medium text-red-800'>
                                    Payment Error
                                </h3>
                                <p className='text-sm text-red-700 mt-1'>
                                    {error}
                                </p>
                            </div>
                            <button 
                                onClick={() => setError(null)}
                                className='text-red-400 hover:text-red-600'
                            >
                                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                    <path 
                                        fillRule='evenodd' 
                                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' 
                                        clipRule='evenodd' 
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAuthModal && (
                <AuthPromptModal
                    onClose={() => setShowAuthModal(false)}
                    onContinueAsGuest={() => {
                        setShowAuthModal(false)
                        handleCheckout()
                    }}
                />
            )}

            <div className='flex justify-end w-full'>
                <DefaultButton
                    color={tablatures.length === 0 ? 'disabled' : 'purple'}
                    className='px-10 py-2 xs:px-10 xl:py-2 rounded-none font-bold text-lg'
                    onClick={() => {
                        if (!isSignedIn) {
                            setShowAuthModal(true)
                        } else {
                            handleCheckout()
                        }
                    }}
                    disabled={isLoading || tablatures.length === 0}
                >
                    {isLoading ? 'Processing...' : 'Proceed to Payment'}
                </DefaultButton>
            </div>
        </>
    )
}
