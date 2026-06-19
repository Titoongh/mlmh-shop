'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConfirmStripeSessionProps {
    sessionId: string
    userId: string | null
}

type Status = 'confirming' | 'success_authenticated' | 'success_anonymous' | 'error'

export default function ConfirmStripeSession({
    sessionId,
    userId,
}: ConfirmStripeSessionProps) {
    const [status, setStatus] = useState<Status>('confirming')
    const [error, setError] = useState<string | null>(null)
    const downloadTriggered = useRef(false)
    const router = useRouter()

    useEffect(() => {
        const confirmSession = async () => {
            try {
                const response = await fetch('/api/checkout-v2/confirm-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to confirm session')
                }

                if (data.mode === 'anonymous') {
                    setStatus('success_anonymous')
                } else {
                    setStatus('success_authenticated')
                    setTimeout(() => router.push('/user/downloads'), 2000)
                }
            } catch (err: any) {
                console.error('Error confirming session:', err)
                setError(err.message)
                setStatus('error')
            }
        }

        confirmSession()
    }, [sessionId, router])

    // Auto-trigger download for anonymous users
    useEffect(() => {
        if (status === 'success_anonymous' && !downloadTriggered.current) {
            downloadTriggered.current = true
            const link = document.createElement('a')
            link.href = `/api/download-v2?session_id=${sessionId}`
            link.download = 'tablatures.zip'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }, [status, sessionId])

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
                    Do not worry — if your payment went through, you will
                    receive an email with your download link.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (status === 'success_anonymous') {
        return (
            <div className='text-center'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                </div>
                <h2 className='text-xl font-semibold text-green-600 mb-2'>
                    Payment Confirmed!
                </h2>
                <p className='text-gray-600 mb-2'>
                    Your download is starting automatically...
                </p>
                <p className='text-sm text-gray-500 mb-6'>
                    If it doesn&apos;t start, click the button below.
                </p>
                <a
                    href={`/api/download-v2?session_id=${sessionId}`}
                    className='inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 mb-6'
                    download
                >
                    Download your files
                </a>
                <p className='text-sm text-gray-400'>
                    You will also receive an email with your download link.{' '}
                    <a href='/' className='underline'>Return to shop</a>
                </p>
            </div>
        )
    }

    // success_authenticated
    return (
        <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
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
