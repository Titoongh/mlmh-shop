// In-memory tracking for background zip-build jobs (see build-zip.ts). One
// process instance only — fine for this app's single self-hosted container;
// a restart mid-download just loses the job, and the client's poll loop
// surfaces that as a clean error rather than hanging forever.
//
// Global-attached (like app/prisma.ts) so dev's webpack HMR reuses the same
// Map and cleanup timer across module reloads instead of leaking a new one
// on every edit.

interface DownloadJob {
    status: 'pending' | 'done' | 'error'
    ownerUserId: string
    totalBytes: number | null
    bytesDone: number
    filename?: string
    zipBuffer?: ArrayBuffer
    error?: string
    createdAt: number
}

const JOB_TTL_MS = 20 * 60 * 1000 // abandoned jobs (never polled/fetched) expire
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

const globalForJobs = global as unknown as {
    downloadJobs?: Map<string, DownloadJob>
    downloadJobsCleanupStarted?: boolean
}

const jobs = globalForJobs.downloadJobs ?? new Map<string, DownloadJob>()
if (process.env.NODE_ENV !== 'production') globalForJobs.downloadJobs = jobs

if (!globalForJobs.downloadJobsCleanupStarted) {
    globalForJobs.downloadJobsCleanupStarted = true
    setInterval(() => {
        const now = Date.now()
        for (const [id, job] of Array.from(jobs)) {
            if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id)
        }
    }, CLEANUP_INTERVAL_MS).unref()
}

export function createJob(
    jobId: string,
    ownerUserId: string,
    totalBytes: number | null,
): void {
    jobs.set(jobId, {
        status: 'pending',
        ownerUserId,
        totalBytes,
        bytesDone: 0,
        createdAt: Date.now(),
    })
}

export function updateJobProgress(jobId: string, bytesDone: number): void {
    const job = jobs.get(jobId)
    if (job) job.bytesDone = bytesDone
}

export function completeJob(
    jobId: string,
    filename: string,
    zipBuffer: ArrayBuffer,
): void {
    const job = jobs.get(jobId)
    if (!job) return
    job.status = 'done'
    job.filename = filename
    job.zipBuffer = zipBuffer
    job.bytesDone = job.totalBytes ?? job.bytesDone
}

export function failJob(jobId: string, error: string): void {
    const job = jobs.get(jobId)
    if (!job) return
    job.status = 'error'
    job.error = error
}

// Read-only status check (progress endpoint) — never returns the buffer.
export function getJobStatus(
    jobId: string,
    ownerUserId: string,
): {
    status: DownloadJob['status']
    bytesDone: number
    totalBytes: number | null
    error: string | undefined
} | null {
    const job = jobs.get(jobId)
    if (!job || job.ownerUserId !== ownerUserId) return null
    return {
        status: job.status,
        bytesDone: job.bytesDone,
        totalBytes: job.totalBytes,
        error: job.error,
    }
}

// Consumes (and evicts) a finished job's payload — called once by the
// result endpoint so the buffer doesn't linger in memory after being served.
export function consumeJobResult(
    jobId: string,
    ownerUserId: string,
): { filename: string; zipBuffer: ArrayBuffer } | null {
    const job = jobs.get(jobId)
    if (
        !job ||
        job.ownerUserId !== ownerUserId ||
        job.status !== 'done' ||
        !job.zipBuffer ||
        !job.filename
    ) {
        return null
    }
    const result = { filename: job.filename, zipBuffer: job.zipBuffer }
    jobs.delete(jobId)
    return result
}
