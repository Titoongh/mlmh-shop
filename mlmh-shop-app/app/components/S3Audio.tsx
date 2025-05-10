'use client'
import React, { useState, useEffect } from 'react'

interface S3AudioProps {
    url: string
    fallbackComponent?: React.ReactNode
    loadingComponent?: React.ReactNode
    disableSignedUrl?: boolean
    className?: string
    controls?: boolean
    autoPlay?: boolean
    loop?: boolean
    muted?: boolean
    preload?: 'auto' | 'metadata' | 'none'
    onError?: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void
    onPlay?: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void
    onPause?: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void
    onEnded?: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void
}

function S3Audio({
    url,
    fallbackComponent,
    loadingComponent,
    disableSignedUrl = false,
    className = 'w-[90%]',
    controls = true,
    autoPlay = false,
    loop = false,
    muted = false,
    preload = 'metadata',
    onError,
    onPlay,
    onPause,
    onEnded,
}: S3AudioProps) {
    const [finalUrl, setFinalUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchSignedUrl = async () => {
            // Voici votre implémentation exacte de fetchSignedUrl
            if (
                url.includes('/public/storage') ||
                url.includes('/api/static') ||
                url.includes('/public/uploads')
            ) {
                try {
                    const baseUrl =
                        process.env.NEXT_PUBLIC_API_URL ||
                        'http://localhost:3000'
                    const response = await fetch(`${baseUrl}/${url}`)
                    if (!response.ok) {
                        throw new Error(`API returned ${response.status}`)
                    }
                    const data = await response.text()
                    setFinalUrl(data)
                } catch (err) {
                    console.error('Error fetching signed URL:', err)
                    setError(true)
                } finally {
                    setIsLoading(false)
                }
            } else {
                setFinalUrl(url)
                setIsLoading(false)
            }
        }

        // Ne déclenche pas fetchSignedUrl si disableSignedUrl est true
        if (disableSignedUrl) {
            setFinalUrl(url)
            setIsLoading(false)
        } else {
            fetchSignedUrl()
        }
    }, [url, disableSignedUrl])

    if (isLoading) {
        return (
            loadingComponent || (
                <div className='flex items-center justify-center w-full h-full bg-black'>
                    <div className='text-white'>loading</div>
                </div>
            )
        )
    }

    if (error || !finalUrl) {
        console.log('FAILED', error, finalUrl)
        return (
            fallbackComponent || (
                <div className='flex flex-col items-center justify-center w-full h-full text-white'>
                    <p>Error</p>
                </div>
            )
        )
    }

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        setError(true)
        if (onError) onError(e)
    }

    // Affichage de l'audio avec tous les props fournis
    return (
        <div className='flex items-center justify-center w-full h-full'>
            <audio
                className={className}
                controls={controls}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                preload={preload}
                onError={handleError}
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
            >
                <source src={finalUrl} type='audio/mpeg' />
                Your browser does not support the audio element.
            </audio>
            {error && (
                <div className='absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-70'>
                    Unable to load audio
                </div>
            )}
        </div>
    )
}

export default S3Audio
