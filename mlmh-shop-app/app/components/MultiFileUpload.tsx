'use client'
import React, { useState } from 'react'
import type {
    TablatureFileData,
    MultiFileUploadProps,
} from './AddTablatureForm.types'

export default function MultiFileUpload({
    onFilesUploaded,
    title,
    existingFiles = [],
}: MultiFileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] =
        useState<TablatureFileData[]>(existingFiles)
    const [error, setError] = useState('')

    const allowedExtensions = ['pdf', 'gp5', 'gpx', 'gp4', 'gp3', 'mid', 'midi']

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        // Validate file types
        const invalidFiles = files.filter(file => {
            const extension = file.name.split('.').pop()?.toLowerCase()
            return !allowedExtensions.includes(extension || '')
        })

        if (invalidFiles.length > 0) {
            setError(
                `Invalid file types: ${invalidFiles
                    .map(f => f.name)
                    .join(', ')}. Allowed types: ${allowedExtensions.join(
                    ', ',
                )}`,
            )
            return
        }

        setSelectedFiles(files)
        setError('')
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || !title.trim()) {
            setError('Please select files and enter a title first')
            return
        }

        setUploading(true)
        setError('')

        try {
            const formData = new FormData()
            selectedFiles.forEach(file => {
                formData.append('files', file)
            })
            formData.append('title', title)

            console.log('Uploading files:', {
                fileCount: selectedFiles.length,
                fileNames: selectedFiles.map(f => f.name),
                title,
            })

            const response = await fetch('/api/admin/upload/tablature', {
                method: 'POST',
                body: formData,
            })

            console.log('Upload response status:', response.status)
            console.log(
                'Upload response headers:',
                Object.fromEntries(response.headers.entries()),
            )

            if (response.ok) {
                const result = await response.json()
                console.log('Upload successful:', result)
                const newFiles = result.files as TablatureFileData[]

                setUploadedFiles(prev => [...prev, ...newFiles])
                setSelectedFiles([])
                onFilesUploaded([...uploadedFiles, ...newFiles])

                // Clear the file input
                const fileInput = document.querySelector(
                    'input[type="file"]',
                ) as HTMLInputElement
                if (fileInput) fileInput.value = ''
            } else {
                // Read response body once and handle parsing
                let errorMessage = 'Upload failed'
                try {
                    const responseText = await response.text()
                    console.log('Raw response:', responseText)

                    // Try to parse as JSON
                    try {
                        const errorData = JSON.parse(responseText)
                        console.error('Upload error response:', errorData)
                        errorMessage = errorData.error || 'Upload failed'
                        if (errorData.details) {
                            errorMessage += `: ${errorData.details}`
                        }
                    } catch (jsonParseError) {
                        // If JSON parsing fails, use the text response
                        console.error('Non-JSON upload response:', responseText)
                        errorMessage = `Server error (${response.status}): ${response.statusText}`
                        if (responseText) {
                            errorMessage += ` - ${responseText.substring(
                                0,
                                200,
                            )}`
                        }
                    }
                } catch (textParseError) {
                    console.error(
                        'Failed to read response text:',
                        textParseError,
                    )
                    errorMessage = `Server error (${response.status}): ${response.statusText}`
                }
                throw new Error(errorMessage)
            }
        } catch (error) {
            console.error('Upload error:', error)
            setError(
                `Upload failed: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            )
        } finally {
            setUploading(false)
        }
    }

    const removeFile = (index: number) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index)
        setUploadedFiles(newFiles)
        onFilesUploaded(newFiles)
    }

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className='space-y-4'>
            <div>
                <label className='block mb-2 text-sm font-medium'>
                    Tablature Files {uploadedFiles.length === 0 && '*'}
                </label>
                <p className='text-sm text-gray-600 mb-3'>
                    Upload multiple files for this tablature (PDF, Guitar Pro
                    files, MIDI, etc.)
                </p>

                {error && (
                    <div className='mb-3 p-3 text-red-700 bg-red-100 border border-red-400 rounded'>
                        {error}
                    </div>
                )}

                {/* File input */}
                <input
                    type='file'
                    multiple
                    accept='.pdf,.gp5,.gpx,.gp4,.gp3,.mid,.midi'
                    onChange={handleFileChange}
                    className='w-full px-4 py-2 border-2 border-black rounded mb-3'
                />

                {/* Selected files (not yet uploaded) */}
                {selectedFiles.length > 0 && (
                    <div className='mb-4'>
                        <h4 className='text-sm font-medium mb-2'>
                            Selected files:
                        </h4>
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded mb-2'
                            >
                                <div>
                                    <p className='text-sm text-blue-700'>
                                        {file.name}
                                    </p>
                                    <p className='text-xs text-blue-600'>
                                        {(file.size / 1024 / 1024).toFixed(2)}{' '}
                                        MB
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => removeSelectedFile(index)}
                                    className='text-red-600 hover:text-red-800 text-sm'
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        <button
                            type='button'
                            onClick={handleUpload}
                            disabled={uploading || !title.trim()}
                            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                        >
                            {uploading
                                ? 'Uploading...'
                                : `Upload ${selectedFiles.length} file${
                                      selectedFiles.length > 1 ? 's' : ''
                                  }`}
                        </button>
                    </div>
                )}

                {/* Uploaded files */}
                {uploadedFiles.length > 0 && (
                    <div>
                        <h4 className='text-sm font-medium mb-2'>
                            Uploaded files ({uploadedFiles.length}):
                        </h4>
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mb-2'
                            >
                                <div>
                                    <p className='text-sm text-green-700'>
                                        {file.filename}
                                    </p>
                                    {file.fileSize && (
                                        <p className='text-xs text-green-600'>
                                            {(
                                                file.fileSize /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{' '}
                                            MB
                                        </p>
                                    )}
                                </div>
                                <button
                                    type='button'
                                    onClick={() => removeFile(index)}
                                    className='text-red-600 hover:text-red-800 text-sm'
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {uploading && (
                    <div className='p-3 bg-yellow-50 border border-yellow-200 rounded'>
                        <p className='text-sm text-yellow-700'>
                            Uploading files...
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
