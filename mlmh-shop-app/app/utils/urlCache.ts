class URLCache {
    private cache = new Map<string, { url: string; timestamp: number }>()
    private readonly TTL = 30 * 60 * 1000

    get(key: string): string | null {
        const entry = this.cache.get(key)
        if (!entry) return null

        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key)
            return null
        }

        return entry.url
    }

    set(key: string, url: string): void {
        this.cache.set(key, { url, timestamp: Date.now() })
    }

    clear(): void {
        this.cache.clear()
    }

    cleanup(): void {
        const now = Date.now()
        const keysToDelete: string[] = []

        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > this.TTL) {
                keysToDelete.push(key)
            }
        })

        keysToDelete.forEach(key => this.cache.delete(key))
    }
}

export const urlCache = new URLCache()

if (typeof window !== 'undefined') {
    setInterval(() => {
        urlCache.cleanup()
    }, 10 * 60 * 1000)
}
