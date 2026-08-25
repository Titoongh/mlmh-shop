'use client'

import { useState } from 'react'

interface DownloadButtonProps {
    tablatureIds: string[]
    methodOfferIds?: string[]
    purchaseId: string
}

const POLL_INTERVAL_MS = 600

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

// 'starting'    — waiting on the /start call itself (brief)
// 'preparing'   — job created, no bytes moved yet (Scaleway existence/URL checks)
// 'downloading' — bytes are actually flowing (server fetching, or us fetching the result)
type Phase = 'starting' | 'preparing' | 'downloading'

export default function DownloadButton({
    tablatureIds,
    methodOfferIds = [],
    purchaseId,
}: DownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [phase, setPhase] = useState<Phase>('starting')
    const [bytesDone, setBytesDone] = useState(0)
    const [totalBytes, setTotalBytes] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const itemCount = tablatureIds.length + methodOfferIds.length

    const handleDownload = async () => {
        if (isDownloading || itemCount === 0) return

        setIsDownloading(true)
        setPhase('starting')
        setBytesDone(0)
        setTotalBytes(null)
        setError(null)

        try {
            const params = new URLSearchParams()
            if (tablatureIds.length > 0) {
                params.set('tablature_ids', tablatureIds.join(','))
            }
            if (methodOfferIds.length > 0) {
                params.set('method_offer_ids', methodOfferIds.join(','))
            }

            // 1) Kick off the build in the background — the server fetches
            // files from Scaleway and zips them, which can take a while for
            // a large method, so we don't block on it here.
            const startRes = await fetch(
                `/api/download-v2/start?${params.toString()}`,
            )
            if (!startRes.ok) {
                const body = await startRes.json().catch(() => null)
                throw new Error(
                    body?.error || `Failed to start download (${startRes.status})`,
                )
            }
            const { jobId, totalBytes: startTotalBytes } = await startRes.json()
            setTotalBytes(startTotalBytes ?? null)
            setPhase('preparing')

            // 2) Poll real byte-level progress until the job is done — this
            // is what actually shows the user something is happening during
            // the (potentially long) server-side fetch.
            while (true) {
                await sleep(POLL_INTERVAL_MS)
                const progressRes = await fetch(
                    `/api/download-v2/progress?jobId=${jobId}`,
                )
                if (!progressRes.ok) {
                    throw new Error('Lost track of the download, please retry')
                }
                const job = await progressRes.json()

                if (job.status === 'error') {
                    throw new Error(job.error || 'Download failed')
                }
                setBytesDone(job.bytesDone)
                if (job.bytesDone > 0) setPhase('downloading')
                if (job.status === 'done') break
            }

            // 3) Fetch the finished zip.
            setPhase('downloading')
            const resultRes = await fetch(
                `/api/download-v2/result?jobId=${jobId}`,
            )
            if (!resultRes.ok) {
                const body = await resultRes.json().catch(() => null)
                throw new Error(body?.error || 'Failed to retrieve the download')
            }
            const disposition = resultRes.headers.get('content-disposition') || ''
            const filenameMatch = disposition.match(/filename="([^"]+)"/)
            const filename = filenameMatch?.[1] || 'download.zip'

            const blob = await resultRes.blob()

            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(objectUrl)
        } catch (err: any) {
            console.error('Download error:', err)
            setError(err?.message || 'Failed to start download. Please try again.')
        } finally {
            setIsDownloading(false)
        }
    }

    const percent =
        totalBytes && totalBytes > 0
            ? Math.min(99, Math.round((bytesDone / totalBytes) * 100))
            : null

    let label: string
    if (phase === 'starting') {
        label = 'Starting…'
    } else if (percent !== null && phase === 'downloading') {
        label = `Downloading… ${percent}% (${formatBytes(bytesDone)} / ${formatBytes(totalBytes as number)})`
    } else if (phase === 'downloading') {
        label = 'Downloading…'
    } else {
        label = 'Preparing…'
    }

    return (
        <div className='flex flex-col items-end gap-1.5'>
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`inline-flex items-center gap-2 font-bold px-4 py-2.5 rounded-md border-2 border-black text-sm transition-all ${
                    isDownloading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-dark text-white shadow-small hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-base'
                }`}
            >
                {isDownloading ? (
                    <>
                        <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                        {label}
                    </>
                ) : (
                    <>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                        </svg>
                        Download ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </>
                )}
            </button>
            {isDownloading && percent !== null && (
                <div className='w-full h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                        className='h-full bg-purple-dark transition-all duration-150'
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}
            {error && <p className='text-xs text-red max-w-[180px] text-right'>{error}</p>}
        </div>
    )
}
