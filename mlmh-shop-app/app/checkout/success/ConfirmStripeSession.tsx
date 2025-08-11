'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConfirmStripeSessionProps {
    sessionId: string
    userId: string
}

export default function ConfirmStripeSession({
    sessionId,
    userId,
}: ConfirmStripeSessionProps) {
    const [status, setStatus] = useState<'confirming' | 'success' | 'error'>(
        'confirming',
    )
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const confirmSession = async () => {
            try {
                console.log('Triggering forced sync for session:', sessionId)

                // Call our API endpoint that forces a sync
                const response = await fetch('/api/checkout/confirm-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to confirm session')
                }

                console.log('Session confirmed successfully:', data)
                setStatus('success')

                // Redirect to downloads page after a short delay
                setTimeout(() => {
                    router.push('/user/downloads')
                }, 2000)
            } catch (error: any) {
                console.error('Error confirming session:', error)
                setError(error.message)
                setStatus('error')
            }
        }

        confirmSession()
    }, [sessionId, userId, router])

    if (status === 'confirming') {
        return (
            <div className='flex flex-col items-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4'></div>
                <p className='text-gray-600'>Confirming your payment...</p>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className='text-center'>
                <h2 className='text-xl font-semibold text-red-600 mb-2'>
                    Confirmation Error
                </h2>
                <p className='text-gray-600 mb-4'>
                    {error || 'There was an issue confirming your payment.'}
                </p>
                <p className='text-sm text-gray-500 mb-4'>
                    Do not worry - if your payment went through, you will
                    receive an email with download links.
                </p>
                <div className='space-x-4'>
                    <button
                        onClick={() => window.location.reload()}
                        className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                    >
                        Try Again
                    </button>
                    <a
                        href='/user/downloads'
                        className='bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700'
                    >
                        Check Downloads
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className='text-center'>
            <div className='mb-4'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-8 h-8 text-green-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                        />
                    </svg>
                </div>
            </div>
            <h2 className='text-xl font-semibold text-green-600 mb-2'>
                Payment Confirmed!
            </h2>
            <p className='text-gray-600 mb-4'>
                Your purchase has been processed successfully.
            </p>
            <p className='text-sm text-gray-500'>
                Redirecting to your downloads...
            </p>
        </div>
    )
}
