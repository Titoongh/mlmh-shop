'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ConfirmStripeSessionProps {
    sessionId: string
    userId: string | null
}

type Status =
    | 'confirming'
    | 'success_authenticated'
    | 'success_anonymous'
    | 'pending_payment'
    | 'payment_failed'
    | 'error'

// While an async payment (PayPal, Klarna…) settles, re-check every 5s so the
// download starts by itself the moment Stripe confirms — most settle within a
// couple of minutes. Stop after 10 min; the email link covers the long tail.
const POLL_INTERVAL_MS = 5_000
const MAX_POLLS = 120

export default function ConfirmStripeSession({
    sessionId,
    userId,
}: ConfirmStripeSessionProps) {
    const [status, setStatus] = useState<Status>('confirming')
    const [error, setError] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(3)
    const downloadTriggered = useRef(false)
    const pollCount = useRef(0)
    const router = useRouter()

    const confirmSession = useCallback(
        async (isPoll = false) => {
            try {
                const response = await fetch('/api/checkout-v2/confirm-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                })

                const data = await response.json()

                // 202: payment made with a delayed-notification method
                // (PayPal, Klarna…) and still being confirmed by Stripe.
                if (response.status === 202 && data.pending) {
                    setStatus('pending_payment')
                    return
                }

                // 402: the payment provider definitively declined it.
                if (response.status === 402 && data.failed) {
                    setStatus('payment_failed')
                    return
                }

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
                // A transient failure during background polling shouldn't
                // replace the "payment being confirmed" screen with an error.
                if (isPoll) return
                setError(err.message)
                setStatus('error')
            }
        },
        [sessionId],
    )

    useEffect(() => {
        confirmSession()
    }, [confirmSession])

    useEffect(() => {
        if (status !== 'pending_payment') return
        const interval = setInterval(() => {
            pollCount.current += 1
            if (pollCount.current > MAX_POLLS) {
                clearInterval(interval)
                return
            }
            confirmSession(true)
        }, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [status, confirmSession])

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

    if (status === 'pending_payment') {
        return (
            <div className='text-center space-y-4'>
                <div className='w-16 h-16 rounded-full bg-orange-khaki border-2 border-black flex items-center justify-center mx-auto shadow-base'>
                    <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                </div>
                <h2 className='text-2xl font-bold'>Payment being confirmed…</h2>
                <p className='text-gray-600 max-w-sm mx-auto'>
                    Your payment was submitted and is being confirmed by your
                    payment provider — usually within a couple of minutes.
                </p>
                <p className='text-gray-600 max-w-sm mx-auto'>
                    This page updates automatically: your download will start
                    here as soon as the payment is confirmed.
                </p>
                <p className='text-sm text-gray-500 max-w-sm mx-auto'>
                    You&apos;ll also receive an email with your download link,
                    so you can safely close this page.
                </p>
                <div className='flex justify-center pt-2'>
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

    if (status === 'payment_failed') {
        return (
            <div className='text-center space-y-4'>
                <div className='w-16 h-16 rounded-full bg-red/10 border-2 border-red flex items-center justify-center mx-auto'>
                    <svg className='w-8 h-8 text-red' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                </div>
                <h2 className='text-2xl font-bold'>Payment failed</h2>
                <p className='text-gray-600 max-w-sm mx-auto'>
                    Your payment provider declined the payment, so you have not
                    been charged.
                </p>
                <p className='text-sm text-gray-500 max-w-sm mx-auto'>
                    Your cart is still saved — you can try again with another
                    payment method.
                </p>
                <div className='flex flex-col sm:flex-row gap-3 justify-center pt-2'>
                    <Link
                        href='/checkout'
                        className='bg-purple-dark text-white font-bold px-6 py-3 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                    >
                        Try again
                    </Link>
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
