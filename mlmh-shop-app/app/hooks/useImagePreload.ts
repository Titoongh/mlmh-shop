import { useEffect, useCallback } from 'react'
import { imageService } from '../services/imageService'

interface UseImagePreloadOptions {
    enabled?: boolean
    priority?: boolean
    batchSize?: number
}

export const useImagePreload = (
    imageSources: string[],
    options: UseImagePreloadOptions = {},
) => {
    const { enabled = true, priority = false, batchSize = 10 } = options

    const preloadImages = useCallback(async () => {
        if (!enabled || imageSources.length === 0) return

        const validSources = imageSources.filter(
            src => src && typeof src === 'string',
        )

        if (validSources.length === 0) return

        if (priority) {
            // For priority images, prefetch immediately
            await imageService.prefetchUrls(validSources.slice(0, batchSize))
        } else {
            // For non-priority images, queue them for later
            validSources.forEach(src => imageService.queueForPrefetch(src))
        }
    }, [imageSources, enabled, priority, batchSize])

    useEffect(() => {
        preloadImages()
    }, [preloadImages])

    return {
        preloadImages,
    }
}

// Hook for preloading images when they enter the viewport -- Not use for the moment
export const useImagePreloadOnView = (
    imageSources: string[],
    options: UseImagePreloadOptions & { rootMargin?: string } = {},
) => {
    const { rootMargin = '100px', ...preloadOptions } = options
    const { preloadImages } = useImagePreload(imageSources, preloadOptions)

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        preloadImages()
                        observer.unobserve(entry.target)
                    }
                })
            },
            { rootMargin },
        )

        // We'll observe the document body as a proxy for when the component is visible
        if (document.body) {
            observer.observe(document.body)
        }

        return () => observer.disconnect()
    }, [preloadImages, rootMargin])

    return { preloadImages }
}
