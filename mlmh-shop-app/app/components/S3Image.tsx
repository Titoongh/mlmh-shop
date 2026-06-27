'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { imageService } from '../services/imageService'
import { ImageSkeleton, ImageError } from './ImageComponents'

interface S3ImageProps extends Omit<ImageProps, 'src'> {
    src: string
    fallbackComponent?: React.ReactNode
    loadingComponent?: React.ReactNode
    disableSignedUrl?: boolean
    lazy?: boolean
    rootMargin?: string
    prefetch?: boolean
}

function S3Image({
    src,
    alt = 'Image',
    fallbackComponent,
    loadingComponent,
    disableSignedUrl = false,
    lazy = true,
    rootMargin = '50px',
    prefetch = false,
    ...imageProps
}: S3ImageProps) {
    const [finalSrc, setFinalSrc] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const [isInView, setIsInView] = useState(!lazy)
    const imgRef = useRef<HTMLDivElement>(null)

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazy || isInView) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    observer.disconnect()
                }
            },
            { rootMargin },
        )

        if (imgRef.current) {
            observer.observe(imgRef.current)
        }

        return () => observer.disconnect()
    }, [lazy, rootMargin, isInView])

    // Prefetch logic
    useEffect(() => {
        if (prefetch && !disableSignedUrl) {
            imageService.queueForPrefetch(src)
        }
    }, [src, prefetch, disableSignedUrl])

    useEffect(() => {
        if (!isInView) return

        const fetchSignedUrl = async () => {
            if (disableSignedUrl) {
                setFinalSrc(src)
                setIsLoading(false)
                return
            }

            if (
                src.includes('/public/storage') ||
                src.includes('/api/static') ||
                src.includes('/public/uploads')
            ) {
                try {
                    const url = await imageService.getSignedUrl(src)
                    setFinalSrc(url)
                } catch (err) {
                    console.error('Error fetching signed URL:', err)
                    setError(true)
                } finally {
                    setIsLoading(false)
                }
            } else {
                setFinalSrc(src)
                setIsLoading(false)
            }
        }

        fetchSignedUrl()
    }, [src, disableSignedUrl, isInView])

    // Avec `fill`, la boîte (placeholder ET image) doit remplir le conteneur du
    // consommateur pour éviter un collapse/shift entre les états.
    const boxClassName = `${imageProps.fill ? 'relative h-full w-full ' : ''}${
        imageProps.className ?? ''
    }`.trim()

    if (isLoading) {
        return (
            <div ref={imgRef} className={boxClassName}>
                {loadingComponent || (
                    <ImageSkeleton className='w-full h-full' />
                )}
            </div>
        )
        // Clean expired entries
    }

    if (error || !finalSrc) {
        return (
            <div ref={imgRef} className={boxClassName}>
                {fallbackComponent || <ImageError className='w-full h-full' />}
            </div>
        )
    }

    return (
        // Avec `fill`, next/image se positionne par rapport au parent DIRECT : ce
        // wrapper doit donc être positionné (relative) et remplir la boîte du
        // consommateur (h-full w-full). Sans `fill`, l'Image se dimensionne seule.
        <div
            ref={imgRef}
            className={imageProps.fill ? 'relative h-full w-full' : undefined}
        >
            <Image
                src={finalSrc}
                alt={alt}
                {...imageProps}
                onError={() => setError(true)}
            />
        </div>
    )
}

export default S3Image
