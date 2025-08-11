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
      // Use the new download endpoint with tablature IDs
      const downloadUrl = `/api/download-v2?tablature_ids=${tablatureIds.join(',')}`
      
      // Create a temporary link to trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = '' // Let the server determine filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Note: We can't reliably detect when the download completes,
      // so we'll reset the loading state after a reasonable delay
      setTimeout(() => {
        setIsDownloading(false)
      }, 2000)

    } catch (err: any) {
      console.error('Download error:', err)
      setError('Failed to start download. Please try again.')
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDownloading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isDownloading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Preparing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download ({tablatureIds.length} {tablatureIds.length === 1 ? 'item' : 'items'})
          </div>
        )}
      </button>
      
      {error && (
        <p className="text-sm text-red-600 max-w-xs text-right">{error}</p>
      )}
      
      <p className="text-xs text-gray-500 max-w-xs text-right">
        This will download all tablatures from this purchase as a ZIP file
      </p>
    </div>
  )
}