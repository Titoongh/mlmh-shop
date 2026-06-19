'use client'

import { useState } from 'react'

interface DownloadButtonProps {
    tablatureIds: string[]
    purchaseId: string
}

export default function DownloadButton({ tablatureIds, purchaseId }: DownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDownload = async () => {
        if (isDownloading || tablatureIds.length === 0) return

        setIsDownloading(true)
        setError(null)

        try {
            const downloadUrl = `/api/download-v2?tablature_ids=${tablatureIds.join(',')}`
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = ''
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setTimeout(() => setIsDownloading(false), 2000)
        } catch (err: any) {
            console.error('Download error:', err)
            setError('Failed to start download. Please try again.')
            setIsDownloading(false)
        }
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
                        Preparing…
                    </>
                ) : (
                    <>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                        </svg>
                        Download ({tablatureIds.length} {tablatureIds.length === 1 ? 'file' : 'files'})
                    </>
                )}
            </button>
            {error && <p className='text-xs text-red max-w-[180px] text-right'>{error}</p>}
        </div>
    )
}
