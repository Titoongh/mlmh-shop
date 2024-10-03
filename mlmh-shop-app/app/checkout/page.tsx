'use client'
import React, { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
)

export default function PreviewPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const tablatureIds = [
        'aee0a5a5-f93f-467b-8bf0-165247e648d7',
        'e482f226-c0c8-4d98-88fa-3990bc229e71',
    ]

    useEffect(() => {
        // if success=true in the URL, set isSuccess to true
        const isSuccess = new URLSearchParams(window.location.search).get(
            'success',
        )
        if (isSuccess === 'true') setIsSuccess(true)
    }, [setIsSuccess])

    const handleCheckout = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderItems: { tablatureIds } }),
            })

            if (response.ok) {
                const { url } = await response.json()
                window.location.href = url
            } else {
                // Handle errors
                console.error('Checkout failed')
            }
        } catch (error) {
            console.error('Error during checkout:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = async () => {
        setIsLoading(true)
        try {
            const sessionId = new URLSearchParams(window.location.search).get(
                'session_id',
            )
            console.log('frontend sessionId', sessionId)
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
                a.download = 'tablature.jpg'
                a.click()
            } else {
                // Handle errors
                console.error('Download failed')
            }
        } catch (error) {
            console.error('Error during download:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <button
                onClick={isSuccess ? handleDownload : handleCheckout}
                disabled={isLoading}
            >
                {isLoading
                    ? 'Processing...'
                    : isSuccess
                      ? 'Download'
                      : 'Checkout'}
            </button>
        </div>
    )
}
