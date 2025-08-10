'use client'
import React, { useState, useCallback } from 'react'
import { Content } from '@prisma/client'
import { ContentFormData, ContentItem, processContents } from './ContentItem'
import MultiFileUpload from './MultiFileUpload'
import type {
    TablatureFormData,
    TablatureFileData,
    AddTablatureFormClientProps,
} from './AddTablatureForm.types'

export default function AddTablatureFormClient({
    id,
    mode = 'create',
    initialArtists,
    initialTablature,
}: AddTablatureFormClientProps) {
    // Initialize form data based on mode and initial data
    const [formData, setFormData] = useState<TablatureFormData>(() => {
        if (mode === 'update' && initialTablature) {
            return {
                title: initialTablature.title,
                price: initialTablature.price,
                description: initialTablature.description || '',
                artists: initialTablature.artists?.map(a => a.id) || [],
                musicalGenres:
                    initialTablature.musicalGenres?.map(g => g.id) || [],
                hidden: initialTablature.hidden || false,
            }
        }
        return {
            title: '',
            price: 3.5,
            description: '',
            artists: [],
            musicalGenres: [],
            hidden: false,
        }
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Initialize uploaded files based on initial data
    const [uploadedFiles, setUploadedFiles] = useState<TablatureFileData[]>(
        () => {
            if (mode === 'update' && initialTablature?.files?.length) {
                return initialTablature.files
            }
            return []
        },
    )

    // Initialize contents based on initial data
    const [contents, setContents] = useState<ContentFormData[]>(() => {
        if (mode === 'update' && initialTablature?.contents?.length) {
            return initialTablature.contents.map((content: Content) => ({
                type: content.type,
                url: content.url || '',
                rank: content.rank,
                uploadType: 'url' as const,
            }))
        }
        return [
            {
                type: 'VIDEO' as const,
                url: '',
                file: undefined,
                rank: 1,
                uploadType: 'url' as const,
            },
        ]
    })

    const submitButtonText = loading
        ? `${mode === 'update' ? 'Updating' : 'Adding'}...`
        : `${mode === 'update' ? 'Update' : 'Add'} Tablature`

    const handleFilesUploaded = useCallback((files: TablatureFileData[]) => {
        setUploadedFiles(files)
        setError('') // Clear any previous errors
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const processedContents = await handleContentSubmit(e)
            const url =
                mode === 'update'
                    ? `/api/admin/tablatures/${id}`
                    : '/api/admin/tablatures'
            const method = mode === 'update' ? 'PUT' : 'POST'

            // Create submission data
            const submissionData: any = {
                ...formData,
                contents: processedContents,
                files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
            }


            console.log('Submitting to:', url)
            console.log('Method:', method)
            console.log('Data:', submissionData)

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            })

            console.log('Response status:', response.status)
            console.log(
                'Response headers:',
                Object.fromEntries(response.headers.entries()),
            )

            if (response.ok) {
                if (mode === 'create') {
                    resetForm()
                }
                setSuccess(
                    `Tablature ${
                        mode === 'update' ? 'updated' : 'added'
                    } successfully!`,
                )
            } else {
                // Try to parse error response as JSON first
                let errorMessage = `Failed to ${mode} tablature`
                try {
                    const errorData = await response.json()
                    if (errorData.error) {
                        errorMessage = errorData.error
                        if (errorData.details) {
                            errorMessage += `: ${errorData.details}`
                        }
                    }
                } catch (parseError) {
                    // If JSON parsing fails, it might be HTML error page
                    const responseText = await response.text()
                    console.error('Non-JSON response:', responseText)
                    errorMessage = `Server error (${response.status}): ${response.statusText}`
                }
                setError(errorMessage)
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const addContent = useCallback(() => {
        setContents(prev => [
            ...prev,
            {
                type: 'VIDEO',
                rank: prev.length + 1,
                uploadType: 'url',
            },
        ])
    }, [])

    const handleContentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            console.log('Processing contents:', contents)
            const processedContents = await processContents(contents)
            console.log('Processed contents:', processedContents)
            return processedContents
        } catch (error) {
            console.error('Upload error:', error)
            throw error
        }
    }

    const removeContent = useCallback((index: number) => {
        setContents(prev => prev.filter((_, i) => i !== index))
    }, [])

    const updateContent = useCallback(
        (index: number, data: Partial<ContentFormData>) => {
            setContents(prev =>
                prev.map((content, i) =>
                    i === index ? { ...content, ...data } : content,
                ),
            )
        },
        [],
    )

    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            price: 5,
            description: '',
            artists: [],
            musicalGenres: [],
            hidden: false,
        })
        setUploadedFiles([])
        setContents([
            {
                type: 'VIDEO',
                url: '',
                file: undefined,
                rank: 1,
                uploadType: 'url',
            },
        ])
        setError('')
        setSuccess('')
    }, [])

    return (
        <div className='w-full max-w-2xl'>
            <h2 className='mb-6 text-2xl font-bold'>
                {mode === 'create' ? 'Add New Tablature' : 'Update Tablature'}
            </h2>
            {error && (
                <div className='px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded'>
                    {error}
                </div>
            )}
            {success && (
                <div className='px-4 py-3 mb-4 text-black border-2 rounded bg-green border-green-darkcyan'>
                    {success}
                </div>
            )}
            <form onSubmit={handleSubmit} className='space-y-6'>
                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Title
                    </label>
                    <input
                        type='text'
                        value={formData.title}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                title: e.target.value,
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        required
                    />
                </div>

                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Price ($)
                    </label>
                    <input
                        type='number'
                        value={formData.price}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                price: parseFloat(e.target.value),
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        required
                        min='0'
                        step='0.01'
                    />
                </div>

                <div>
                    <MultiFileUpload
                        title={formData.title}
                        existingFiles={uploadedFiles}
                        onFilesUploaded={handleFilesUploaded}
                    />
                </div>

                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        rows={4}
                    />
                </div>

                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Select Artists
                    </label>
                    <select
                        multiple
                        value={formData.artists}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                artists: Array.from(
                                    e.target.selectedOptions,
                                    option => option.value,
                                ),
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        required
                    >
                        {initialArtists.map(artist => (
                            <option key={artist.id} value={artist.id}>
                                {artist.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <label className='block mb-2 text-sm font-medium'>
                            Content Items
                        </label>
                        <button
                            type='button'
                            onClick={addContent}
                            className='underline text-purple-dark'
                        >
                            + Add Content
                        </button>
                    </div>
                    {contents.map((content, index) => (
                        <ContentItem
                            key={index}
                            content={content}
                            onUpdate={data => updateContent(index, data)}
                            onRemove={() => removeContent(index)}
                        />
                    ))}
                </div>

                <div className='flex items-center py-4 space-x-2'>
                    <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={formData.hidden}
                            onChange={e => {
                                setFormData(prev => {
                                    return {
                                        ...prev,
                                        hidden: !prev.hidden,
                                    }
                                })
                            }}
                            className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-dark"></div>
                        <span className='ml-3 text-sm font-medium'>
                            {formData.hidden ? 'Hidden' : 'Visible'}
                        </span>
                    </label>
                    <div className='text-sm text-gray-500'>
                        {formData.hidden
                            ? 'This tab will not be visible to users'
                            : 'This tab will be visible to users'}
                    </div>
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='w-full px-4 py-2 text-white transition-colors rounded bg-purple-dark hover:bg-purple-medium'
                >
                    {submitButtonText}
                </button>
            </form>
        </div>
    )
}
