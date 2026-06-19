'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    const [countdown, setCountdown] = useState(3)
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
                }
            } catch (err: any) {
                console.error('Error confirming session:', err)
                setError(err.message)
                setStatus('error')
            }
        }

        confirmSession()
    }, [sessionId, router])

    useEffect(() => {
        if (status !== 'success_authenticated') return
        if (countdown <= 0) {
            router.push('/user/downloads')
            return
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [status, countdown, router])

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
            <div className='flex flex-col items-center gap-6'>
                <div className='w-16 h-16 rounded-full border-4 border-orange-khaki border-t-transparent animate-spin' />
                <p className='text-lg font-medium'>Confirming your payment…</p>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className='text-center space-y-4'>
                <div className='w-16 h-16 rounded-full bg-red/10 border-2 border-red flex items-center justify-center mx-auto'>
                    <svg className='w-8 h-8 text-red' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                </div>
                <h2 className='text-2xl font-bold'>Something went wrong</h2>
                <p className='text-gray-600 max-w-sm mx-auto'>
                    {error || 'We could not confirm your payment.'}
                </p>
                <p className='text-sm text-gray-500 max-w-sm mx-auto'>
                    Don&apos;t worry — if your payment went through, you&apos;ll receive an email with your download link.
                </p>
                <div className='flex flex-col sm:flex-row gap-3 justify-center pt-2'>
                    <button
                        onClick={() => window.location.reload()}
                        className='bg-purple-dark text-white font-bold px-6 py-3 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                    >
                        Try again
                    </button>
                    <Link
                        href='/'
                        className='text-center border-2 border-black font-medium px-6 py-3 rounded-md hover:bg-black hover:text-white transition-colors'
                    >
                        Back to shop
                    </Link>
                </div>
            </div>
        )
    }

    if (status === 'success_anonymous') {
        return (
            <div className='text-center space-y-6'>
                <div className='w-20 h-20 rounded-full bg-purple-dark border-2 border-black flex items-center justify-center mx-auto shadow-base'>
                    <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                    </svg>
                </div>

                <div>
                    <h2 className='text-3xl font-bold mb-2'>Payment confirmed!</h2>
                    <p className='text-gray-600'>Your download is starting automatically…</p>
                </div>

                <a
                    href={`/api/download-v2?session_id=${sessionId}`}
                    className='inline-flex items-center gap-2 bg-purple-dark text-white font-bold px-8 py-4 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                    download
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Download my files
                </a>

                <p className='text-sm text-gray-400'>
                    <Link href='/' className='underline hover:text-gray-600'>Return to shop</Link>
                </p>
            </div>
        )
    }

    // success_authenticated
    return (
        <div className='text-center space-y-6'>
            <div className='w-20 h-20 rounded-full bg-purple-dark border-2 border-black flex items-center justify-center mx-auto shadow-base'>
                <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                </svg>
            </div>

            <div>
                <h2 className='text-3xl font-bold mb-2'>Payment confirmed!</h2>
                <p className='text-gray-600'>Your purchase has been added to your library.</p>
            </div>

            <div className='flex flex-col items-center gap-2'>
                <Link
                    href='/user/downloads'
                    className='inline-flex items-center gap-2 bg-purple-dark text-white font-bold px-8 py-4 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Go to my downloads
                </Link>
                <p className='text-sm text-gray-400'>Redirecting in {countdown}s…</p>
            </div>

            <p className='text-sm text-gray-400'>
                <Link href='/' className='underline hover:text-gray-600'>Return to shop</Link>
            </p>
        </div>
    )
}
