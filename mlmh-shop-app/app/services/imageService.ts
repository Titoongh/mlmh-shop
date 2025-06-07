import { urlCache } from '../utils/urlCache'
import { performanceMonitor } from '../utils/performanceMonitor'

class ImageService {
    private pendingRequests = new Map<string, Promise<string>>()
    private batchQueue: string[] = []
    private batchTimeout: NodeJS.Timeout | null = null
    private readonly BATCH_SIZE = 10
    private readonly BATCH_DELAY = 100 // ms

    async getSignedUrl(src: string): Promise<string> {
        // Check cache first
        const cached = urlCache.get(src)
        if (cached) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`🎯 Cache hit for: ${src}`)
            }
            return cached
        }

        // Check if request is already in progress
        if (this.pendingRequests.has(src)) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`⏳ Request already pending for: ${src}`)
            }
            return this.pendingRequests.get(src)!
        }

        // Create new request
        const requestPromise = this.fetchSignedUrl(src)
        this.pendingRequests.set(src, requestPromise)

        try {
            const url = await requestPromise
            urlCache.set(src, url)
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Fetched and cached: ${src}`)
            }
            return url
        } finally {
            this.pendingRequests.delete(src)
        }
    }

    private async fetchSignedUrl(src: string): Promise<string> {
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/${src}`)

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`)
        }

        return response.text()
    }

    // Batch prefetch multiple URLs
    async prefetchUrls(sources: string[]): Promise<void> {
        const uncachedSources = sources.filter(
            src =>
                !urlCache.get(src) &&
                !this.pendingRequests.has(src) &&
                this.needsSignedUrl(src),
        )

        if (uncachedSources.length === 0) return

        if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 Prefetching ${uncachedSources.length} images...`)
        }

        const startTime = performance.now()

        // Process in batches to avoid overwhelming the server
        for (let i = 0; i < uncachedSources.length; i += this.BATCH_SIZE) {
            const batch = uncachedSources.slice(i, i + this.BATCH_SIZE)
            const promises = batch.map(src =>
                this.getSignedUrl(src).catch(error => {
                    console.warn(`Failed to prefetch ${src}:`, error)
                    return null
                }),
            )

            await Promise.allSettled(promises)

            // Add small delay between batches
            if (i + this.BATCH_SIZE < uncachedSources.length) {
                await new Promise(resolve =>
                    setTimeout(resolve, this.BATCH_DELAY),
                )
            }
        }

        if (process.env.NODE_ENV === 'development') {
            const duration = performance.now() - startTime
            console.log(
                `✨ Prefetched ${
                    uncachedSources.length
                } images in ${duration.toFixed(2)}ms`,
            )
        }
    }

    // Queue URLs for batched prefetching
    queueForPrefetch(src: string): void {
        if (
            !this.needsSignedUrl(src) ||
            urlCache.get(src) ||
            this.pendingRequests.has(src)
        ) {
            return
        }

        this.batchQueue.push(src)

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout)
        }

        this.batchTimeout = setTimeout(() => {
            this.processBatchQueue()
        }, this.BATCH_DELAY)
    }

    private async processBatchQueue(): Promise<void> {
        if (this.batchQueue.length === 0) return

        const batch = [...this.batchQueue]
        this.batchQueue = []
        this.batchTimeout = null

        await this.prefetchUrls(batch)
    }

    private needsSignedUrl(src: string): boolean {
        return (
            src.includes('/public/storage') ||
            src.includes('/api/static') ||
            src.includes('/public/uploads')
        )
    }

    // Clear all caches and pending requests
    clear(): void {
        this.pendingRequests.clear()
        this.batchQueue = []
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout)
            this.batchTimeout = null
        }
        urlCache.clear()
    }
}

export const imageService = new ImageService()
