'use client'
import React from 'react'
import { useImageCache } from '../hooks/useImageCache'

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
    cacheKey?: string
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
    cacheKey,
}: S3AudioProps) {
    const { finalSrc, isLoading, error } = useImageCache(url, {
        disableSignedUrl,
        ...(cacheKey && { cacheKey }),
    })

    if (isLoading) {
        return (
            loadingComponent || (
                <div className='flex items-center justify-center w-full h-full bg-black'>
                    <div className='text-white'>loading</div>
                </div>
            )
        )
    }

    if (error || !finalSrc) {
        console.log('FAILED', error, finalSrc)
        return (
            fallbackComponent || (
                <div className='flex flex-col items-center justify-center w-full h-full text-white'>
                    <p>Error</p>
                </div>
            )
        )
    }

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error(`Failed to load audio: ${finalSrc}`)
        if (onError) onError(e)
    }

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
                <source src={finalSrc} type='audio/mpeg' />
                Your browser does not support the audio element.
            </audio>
        </div>
    )
}

export default S3Audio
