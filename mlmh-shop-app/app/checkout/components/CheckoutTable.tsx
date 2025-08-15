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
import { useAuth, SignInButton } from '@clerk/nextjs'

interface CheckoutTableProps {
    initialTablatures: TablatureWithArtist[]
}

export default function CheckoutTable({
    initialTablatures,
}: CheckoutTableProps) {
    const [tablatures, setTablatures] =
        useState<TablatureWithArtist[]>(initialTablatures)
    const [isLoading, setIsLoading] = useState(false)
    const { removeItem, getItemById } = useCart()
    const { isSignedIn } = useAuth()

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
        const tabIds = tablatures.map(tab => tab.id)
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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
                console.error('Checkout failed', response)
                throw new Error('Checkout failed')
            }
        } catch (error) {
            console.error('Error during checkout:', error)
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
            <div className='flex justify-end w-full'>
                {!isSignedIn ? (
                    <SignInButton mode="modal">
                        <DefaultButton
                            color={tablatures.length === 0 ? 'disabled' : 'purple'}
                            className='px-10 py-2 xs:px-10 xl:py-2 rounded-none font-bold text-lg'
                            disabled={tablatures.length === 0}
                            onClick={() => {}}
                        >
                            Sign in to Purchase
                        </DefaultButton>
                    </SignInButton>
                ) : (
                    <DefaultButton
                        color={tablatures.length === 0 ? 'disabled' : 'purple'}
                        className='px-10 py-2 xs:px-10 xl:py-2 rounded-none font-bold text-lg'
                        onClick={handleCheckout}
                        disabled={isLoading || tablatures.length === 0}
                    >
                        {isLoading ? 'Processing...' : 'Proceed to Payment'}
                    </DefaultButton>
                )}
            </div>
        </>
    )
}
