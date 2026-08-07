'use client'

import { useRef, useState } from 'react'
import type { UploadedTabFile } from './types'

const ALLOWED_EXTENSIONS = ['pdf', 'gp5', 'gpx', 'gp4', 'gp3', 'mid', 'midi']

interface FileUploaderProps {
    // Le titre de la tablature est requis par l'API d'upload (nommage des clés).
    title: string
    files: UploadedTabFile[]
    onChange: (files: UploadedTabFile[]) => void
}

function formatSize(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} Mo`
}

// Upload des fichiers de la tablature (PDF, Guitar Pro, MIDI) vers Scaleway
// via POST /api/admin/upload/tablature. Les fichiers sont uploadés AVANT le
// submit du formulaire ; le formulaire n'envoie que leurs métadonnées.
export default function FileUploader({
    title,
    files,
    onChange,
}: FileUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const chosen = Array.from(e.target.files || [])
        const invalid = chosen.filter(file => {
            const ext = file.name.split('.').pop()?.toLowerCase()
            return !ALLOWED_EXTENSIONS.includes(ext || '')
        })
        if (invalid.length > 0) {
            setError(
                `Type de fichier non autorisé : ${invalid
                    .map(f => f.name)
                    .join(', ')}. Formats acceptés : ${ALLOWED_EXTENSIONS.join(
                    ', ',
                )}.`,
            )
            return
        }
        setSelectedFiles(chosen)
        setError('')
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return
        if (!title.trim()) {
            setError("Renseigne d'abord le titre de la tablature (il sert à nommer les fichiers).")
            return
        }

        setUploading(true)
        setError('')
        try {
            const formData = new FormData()
            selectedFiles.forEach(file => formData.append('files', file))
            formData.append('title', title)

            const response = await fetch('/api/admin/upload/tablature', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                let message = `Échec de l'upload (${response.status})`
                try {
                    const data = await response.json()
                    if (data.error) message = data.error
                } catch {
                    // réponse non-JSON : on garde le message générique
                }
                throw new Error(message)
            }

            const result = await response.json()
            const newFiles = (result.files || []) as UploadedTabFile[]
            onChange([...files, ...newFiles])
            setSelectedFiles([])
            if (inputRef.current) inputRef.current.value = ''
        } catch (err) {
            console.error('Upload error:', err)
            setError(
                err instanceof Error ? err.message : "Échec de l'upload.",
            )
        } finally {
            setUploading(false)
        }
    }

    const removeUploaded = (index: number) => {
        onChange(files.filter((_, i) => i !== index))
    }

    const removeSelected = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div>
            <label className='block mb-2 text-sm font-medium'>
                Fichiers de la tablature {files.length === 0 && '*'}
            </label>
            <p className='text-sm text-gray-600 mb-3'>
                PDF, Guitar Pro (gp3/gp4/gp5/gpx) ou MIDI. C&apos;est ce que le
                client télécharge après achat.
            </p>

            {error && (
                <div className='mb-3 p-3 text-red-700 bg-red-100 border border-red-400 rounded'>
                    {error}
                </div>
            )}

            <input
                ref={inputRef}
                type='file'
                multiple
                accept='.pdf,.gp5,.gpx,.gp4,.gp3,.mid,.midi'
                onChange={handleFileChange}
                className='w-full px-4 py-2 border-2 border-black rounded mb-3'
            />

            {selectedFiles.length > 0 && (
                <div className='mb-4 space-y-2'>
                    <h4 className='text-sm font-medium'>À uploader :</h4>
                    {selectedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className='flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded'
                        >
                            <div>
                                <p className='text-sm text-blue-700'>
                                    {file.name}
                                </p>
                                <p className='text-xs text-blue-600'>
                                    {formatSize(file.size)}
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => removeSelected(index)}
                                className='text-sm text-red-600 hover:text-red-800'
                            >
                                Retirer
                            </button>
                        </div>
                    ))}
                    <button
                        type='button'
                        onClick={handleUpload}
                        disabled={uploading}
                        className='px-4 py-2 text-white rounded bg-purple-dark hover:bg-purple-medium disabled:bg-gray-400 disabled:cursor-not-allowed'
                    >
                        {uploading
                            ? 'Upload en cours…'
                            : `Uploader ${selectedFiles.length} fichier${
                                  selectedFiles.length > 1 ? 's' : ''
                              }`}
                    </button>
                </div>
            )}

            {files.length > 0 && (
                <div className='space-y-2'>
                    <h4 className='text-sm font-medium'>
                        Fichiers de la tablature ({files.length}) :
                    </h4>
                    {files.map((file, index) => (
                        <div
                            key={`${file.scalewayKey}-${index}`}
                            className='flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded'
                        >
                            <div>
                                <p className='text-sm text-green-700'>
                                    {file.filename}
                                </p>
                                {file.fileSize != null && (
                                    <p className='text-xs text-green-600'>
                                        {formatSize(file.fileSize)}
                                    </p>
                                )}
                            </div>
                            <button
                                type='button'
                                onClick={() => removeUploaded(index)}
                                className='text-sm text-red-600 hover:text-red-800'
                            >
                                Retirer
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
