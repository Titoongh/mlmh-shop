'use client'

import { useEffect } from 'react'

export default function CheckoutError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Checkout error:', error)
    }, [error])

    return (
        <div className='flex flex-col items-center justify-center w-full min-h-full p-10 bg-white-oldlace'>
            <div className='h-full flex flex-col justify-center items-center w-full max-w-[1000px] gap-6'>
                <div className='text-center'>
                    <h2 className='text-2xl font-bold text-red-600 mb-4'>
                        Something went wrong!
                    </h2>
                    <p className='text-gray-600 mb-6'>
                        We encountered an error while loading your cart. Please
                        try again.
                    </p>
                    <button
                        onClick={reset}
                        className='px-6 py-3 bg-purple-dark text-white rounded hover:bg-purple-medium transition-colors'
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    )
}
