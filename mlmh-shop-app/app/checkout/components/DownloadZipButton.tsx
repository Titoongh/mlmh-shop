'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface DownloadZipButtonProps {
    sessionId: string
    label?: string
    // Start the download once on mount (success page auto-download).
    autoStart?: boolean
    className?: string
}

// Building the ZIP server-side takes a few seconds; without a lock, impatient
// clicking fires one full download per click. Fetching as a blob (instead of a
// plain <a download>) lets us show a spinner and disable the button meanwhile.
export default function DownloadZipButton({
    sessionId,
    label = 'Download my files',
    autoStart = false,
    className = '',
}: DownloadZipButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inFlight = useRef(false)
    const autoStarted = useRef(false)

    const handleDownload = useCallback(async () => {
        if (inFlight.current) return
        inFlight.current = true
        setIsDownloading(true)
        setError(null)
        try {
            const response = await fetch(
                `/api/download-v2?session_id=${sessionId}`,
            )
            if (!response.ok) throw new Error('Download failed')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'tablatures.zip'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error downloading files:', err)
            setError(
                'The download could not be prepared. Please try again — or use the link in the email we sent you.',
            )
        } finally {
            inFlight.current = false
            setIsDownloading(false)
        }
    }, [sessionId])

    useEffect(() => {
        if (autoStart && !autoStarted.current) {
            autoStarted.current = true
            handleDownload()
        }
    }, [autoStart, handleDownload])

    return (
        <>
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`inline-flex items-center justify-center gap-2 bg-purple-dark text-white font-bold px-8 py-4 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-base disabled:cursor-wait ${className}`}
            >
                {isDownloading ? (
                    <svg className='w-5 h-5 animate-spin' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
                    </svg>
                ) : (
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                )}
                {isDownloading ? 'Preparing your ZIP…' : label}
            </button>
            {error && (
                <p className='text-sm text-red max-w-sm mx-auto mt-2'>{error}</p>
            )}
        </>
    )
}
