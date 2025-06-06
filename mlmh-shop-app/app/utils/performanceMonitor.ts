class PerformanceMonitor {
    private static instance: PerformanceMonitor
    private metrics: Map<string, { startTime: number; endTime?: number }> =
        new Map()

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor()
        }
        return PerformanceMonitor.instance
    }

    startTimer(key: string): void {
        this.metrics.set(key, { startTime: performance.now() })
    }

    endTimer(key: string): number | null {
        const metric = this.metrics.get(key)
        if (!metric) return null

        const endTime = performance.now()
        metric.endTime = endTime
        const duration = endTime - metric.startTime

        if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️  ${key}: ${duration.toFixed(2)}ms`)
        }

        return duration
    }

    getMetric(key: string): number | null {
        const metric = this.metrics.get(key)
        if (!metric || !metric.endTime) return null
        return metric.endTime - metric.startTime
    }

    clearMetrics(): void {
        this.metrics.clear()
    }

    // Convenience method for measuring async operations
    async measure<T>(key: string, fn: () => Promise<T>): Promise<T> {
        this.startTimer(key)
        try {
            const result = await fn()
            this.endTimer(key)
            return result
        } catch (error) {
            this.endTimer(key)
            throw error
        }
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
