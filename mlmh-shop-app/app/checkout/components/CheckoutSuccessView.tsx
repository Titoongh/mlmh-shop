'use client'

import { useEffect, useCallback } from 'react'

interface CheckoutSuccessViewProps {
    sessionId: string
}

export default function CheckoutSuccessView({
    sessionId,
}: CheckoutSuccessViewProps) {
    const handleDownload = useCallback(async () => {
        try {
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
                URL.revokeObjectURL(url)
            } else {
                console.error('Download failed')
            }
        } catch (error) {
            console.error('Error during download:', error)
        }
    }, [sessionId])

    useEffect(() => {
        // Start download automatically when component mounts
        handleDownload()
    }, [handleDownload])

    return (
        <div className='flex flex-col items-start justify-start w-full'>
            <div className='text-4xl font-bold lg:text-6xl text-purple-dark'>
                Thank you for your purchase!
            </div>
            <div className='flex flex-col w-full text-2xl text-black pt-14'>
                Your files download will start soon...
                <button
                    className='underline font-bold text-lg text-slate-400 pt-4 text-left'
                    onClick={handleDownload}
                >
                    Click here if your download did not start automatically
                </button>
            </div>
        </div>
    )
}
