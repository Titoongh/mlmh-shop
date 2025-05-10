'use client'
import React, { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

interface S3ImageProps extends Omit<ImageProps, 'src'> {
    src: string
    fallbackComponent?: React.ReactNode
    loadingComponent?: React.ReactNode
    disableSignedUrl?: boolean
}

function S3Image({
    src,
    alt = 'Image',
    fallbackComponent,
    loadingComponent,
    disableSignedUrl = false,
    ...imageProps
}: S3ImageProps) {
    const [finalSrc, setFinalSrc] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchSignedUrl = async () => {
            if (
                src.includes('/public/storage') ||
                src.includes('/api/static') ||
                src.includes('/public/uploads')
            ) {
                try {
                    const baseUrl =
                        process.env.NEXT_PUBLIC_API_URL ||
                        'http://localhost:3000'
                    const response = await fetch(`${baseUrl}/${src}`)

                    if (!response.ok) {
                        throw new Error(`API returned ${response.status}`)
                    }
                    const data = await response.text()
                    setFinalSrc(data)
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

        if (disableSignedUrl) {
            setFinalSrc(src)
            setIsLoading(false)
        } else {
            fetchSignedUrl()
        }
    }, [src, disableSignedUrl])

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

    return (
        <Image
            src={finalSrc}
            alt={alt}
            {...imageProps}
            onError={() => setError(true)}
        />
    )
}

export default S3Image
