'use client'
import React, { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/app/components/ui/table'
import { useCart } from '../hooks/useCart'
import { Tablature } from '@prisma/client'
import { TablatureWithArtist } from '../types/types'
import { DefaultButton } from '../components/Buttons'

const invoices = [
    {
        invoice: 'INV001',
        paymentStatus: 'Paid',
        totalAmount: '$250.00',
        paymentMethod: 'Credit Card',
    },
    {
        invoice: 'INV002',
        paymentStatus: 'Pending',
        totalAmount: '$150.00',
        paymentMethod: 'PayPal',
    },
    {
        invoice: 'INV003',
        paymentStatus: 'Unpaid',
        totalAmount: '$350.00',
        paymentMethod: 'Bank Transfer',
    },
    {
        invoice: 'INV004',
        paymentStatus: 'Paid',
        totalAmount: '$450.00',
        paymentMethod: 'Credit Card',
    },
    {
        invoice: 'INV005',
        paymentStatus: 'Paid',
        totalAmount: '$550.00',
        paymentMethod: 'PayPal',
    },
    {
        invoice: 'INV006',
        paymentStatus: 'Pending',
        totalAmount: '$200.00',
        paymentMethod: 'Bank Transfer',
    },
    {
        invoice: 'INV007',
        paymentStatus: 'Unpaid',
        totalAmount: '$300.00',
        paymentMethod: 'Credit Card',
    },
]

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
)

const fetchTablatures = async (ids: string[]) => {
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

export default function PreviewPage() {
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [tablatures, setTablatures] = useState<TablatureWithArtist[]>([])

    const { getItems, removeItem, getItemById, emptyCart } = useCart()

    useEffect(() => {
        // if success=true in the URL, set isSuccess to true
        const isSuccessParam = new URLSearchParams(window.location.search).get(
            'success',
        )
        if (isSuccessParam === 'true') {
            handleDownload()
            setIsSuccess(true)
            setIsPageLoading(false)
            emptyCart()
        } else {
            setIsPageLoading(false)
        }
    }, [setIsSuccess])

    useEffect(() => {
        const cartItems = getItems()
        const fetchCartItems = async () => {
            try {
                console.log('fetching tablatures')
                const itemIds = cartItems.map(item => item.id)
                if (itemIds.length === 0) return

                const fetchedTablatures = await fetchTablatures(itemIds)
                setTablatures(fetchedTablatures)
            } catch (error) {
                console.error('Error fetching tablatures:', error)
            }
        }

        fetchCartItems()
    }, [])

    const handleRemove = (id: string) => {
        const item = getItemById(id)
        if (item) {
            removeItem(item)
        }
        setTablatures(tablatures => {
            return tablatures.filter(tab => tab.id !== id)
        })
    }

    const handleCheckout = async () => {
        setIsLoading(true)
        const tabIds = tablatures.map(tab => tab.id)
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        try {
            const response = await fetch(`${baseUrl}/api/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderItems: { tablatureIds: tabIds } }),
            })
            console.log('checkout api response')

            if (response.ok) {
                const { url } = await response.json()
                window.location.href = url
            } else {
                // Handle errors
                console.error('Checkout failed', response)
                throw new Error('Checkout failed')
            }
        } catch (error) {
            console.error('Error during checkout:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = async () => {
        try {
            const sessionId = new URLSearchParams(window.location.search).get(
                'session_id',
            )
            const response = await fetch(
                `/api/download?session_id=${sessionId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )

            if (response.ok) {
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'mlmh.zip'
                a.click()
                console.log('file downloaded')
            } else {
                // Handle errors
                console.error('Download failed')
            }
        } catch (error) {
            console.error('Error during download:', error)
        }
    }

    return (
        <div className='w-full min-h-full flex flex-col justify-center items-center bg-white-oldlace p-10'>
            {isPageLoading ? (
                'Loading..'
            ) : (
                <div className='h-full flex flex-col justify-center items-center w-full max-w-[1000px] gap-6'>
                    {isSuccess ? (
                        <div className='w-full flex flex-col items-start justify-start'>
                            <div className='font-bold text-4xl lg:text-6xl text-purple-dark'>
                                Thank you for your purchase !
                            </div>
                            <div className='w-full flex pt-14 text-black flex-col text-2xl'>
                                Your files download will start soon...
                                <div
                                    className={`underline font-bold text-lg text-slate-400 pt-4`}
                                    onClick={handleDownload}
                                >
                                    Click here if your download did not start
                                    automatically
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader className='h-[100px]'>
                                    <TableRow>
                                        <TableHead className='text-3xl'>
                                            {isSuccess
                                                ? 'Thank you for your purchase !'
                                                : 'My cart'}
                                        </TableHead>
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
                                                <div className='flex flex-col justify-start items-start gap-2'>
                                                    <div>
                                                        <span className='font-bold'>
                                                            {tab.title}
                                                        </span>
                                                        {' - '}
                                                        {tab.artists[0].name}
                                                    </div>
                                                    <button
                                                        className='underline text-sm'
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
                                        <TableCell className='text-right text-xl'>
                                            Total:
                                        </TableCell>
                                        <TableCell className='text-center text-xl'>
                                            <span className='font-bold text-2xl'>
                                                $
                                                {tablatures.reduce(
                                                    (acc, tab) =>
                                                        acc + tab.price,
                                                    0,
                                                )}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                            <div className='w-full flex justify-end'>
                                <DefaultButton
                                    color={
                                        tablatures.length === 0
                                            ? 'disabled'
                                            : 'purple'
                                    }
                                    className={`px-10 py-2 xs:px-10 xl:py-2 rounded-none font-bold text-lg`}
                                    onClick={
                                        isSuccess
                                            ? handleDownload
                                            : handleCheckout
                                    }
                                    disabled={
                                        isLoading || tablatures.length === 0
                                    }
                                >
                                    {isLoading
                                        ? 'Processing...'
                                        : 'Proceed to Payment'}
                                </DefaultButton>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
