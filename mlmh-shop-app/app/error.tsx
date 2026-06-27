'use client'

import { useEffect } from 'react'
import { DefaultButton } from './components/Buttons'

// Frontière d'erreur de segment (App Router). Doit être un Client Component.
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Route error:', error)
    }, [error])

    return (
        <div className='flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 bg-white-oldlace p-10 text-center'>
            <h2 className='text-2xl font-bold'>Something went wrong</h2>
            <p className='max-w-md text-gray-600'>
                An unexpected error occurred. You can try again — if the problem
                persists, please come back later.
            </p>
            <DefaultButton color='purple' onClick={() => reset()} className='px-8 py-2 font-bold'>
                Try again
            </DefaultButton>
        </div>
    )
}
