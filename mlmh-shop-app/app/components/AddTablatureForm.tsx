'use client'
import React, { useEffect, useState } from 'react'
import { Artist, Content, MusicalGenre } from '@prisma/client'
import { ContentFormData, ContentItem, processContents } from './ContentItem'
import AddArtistForm from './AddArtistForm'
import MultiFileUpload from './MultiFileUpload'

interface FormData {
    title: string
    price: number
    downloadLink?: string
    description?: string
    artists: string[]
    musicalGenres?: string[]
    hidden: boolean
}

interface TablatureFile {
    filename: string
    scalewayKey: string
    fileSize?: number
    mimeType?: string
}

interface AddTablatureFormProps {
    id?: string | null
    mode: 'create' | 'update'
}

export default function AddTablatureForm({
    id,
    mode = 'create',
}: AddTablatureFormProps) {
    // Add loading state for initial data
    const [isLoading, setIsLoading] = useState(true)
    const [artists, setArtists] = useState<Artist[]>([])
    const [musicalGenres, setMusicalGenres] = useState<MusicalGenre[]>([])
    const [showNewArtistForm, setShowNewArtistForm] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        title: '',
        price: 5,
        downloadLink: '',
        description: '',
        artists: [],
        musicalGenres: [],
        hidden: false,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<TablatureFile[]>([])
    const [contents, setContents] = useState<ContentFormData[]>([
        {
            type: 'IMAGE',
            url: '',
            file: undefined,
            rank: 1,
            uploadType: 'file',
        },
    ])

    const submitButtonText = loading
        ? `${mode === 'update' ? 'Updating' : 'Adding'}...`
        : `${mode === 'update' ? 'Update' : 'Add'} Tablature`

    useEffect(() => {
        if (mode === 'update' && id) {
            fetchTablatureData(id)
        } else {
            setIsLoading(false)
        }
    }, [id, mode])

    const fetchTablatureData = async (tablatureId: string) => {
        try {
            const baseUrl =
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            const response = await fetch(
                `${baseUrl}/api/tablatures/${tablatureId}`,
            )
            if (response.ok) {
                const tablature = await response.json()
                setFormData({
                    title: tablature.title,
                    price: tablature.price,
                    downloadLink: tablature.downloadLink,
                    description: tablature.description || '',
                    artists: tablature.artists.map((a: Artist) => a.id),
                    musicalGenres:
                        tablature.musicalGenres?.map(
                            (g: MusicalGenre) => g.id,
                        ) || [],
                    hidden: false,
                })
                // For update mode, load existing files
                if (tablature.downloadLink) {
                    // Legacy single file
                    setUploadedFiles([
                        {
                            filename:
                                tablature.downloadLink.split('/').pop() ||
                                'file',
                            scalewayKey: tablature.downloadLink,
                        },
                    ])
                } else if (tablature.files?.length > 0) {
                    // New multiple files structure
                    setUploadedFiles(tablature.files)
                }
                if (tablature.contents?.length) {
                    setContents(
                        tablature.contents.map((content: Content) => ({
                            type: content.type,
                            url: content.url,
                            rank: content.rank,
                            uploadType: 'url',
                        })),
                    )
                }
            }
        } catch (error) {
            console.error('Error fetching tablature:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFilesUploaded = (files: TablatureFile[]) => {
        setUploadedFiles(files)
        setError('') // Clear any previous errors
    }

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

            // Remove downloadLink if we have files (new structure)
            if (uploadedFiles.length > 0) {
                delete submissionData.downloadLink
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

    useEffect(() => {
        fetchArtists()
        fetchMusicalGenres()
    }, [showNewArtistForm])

    const fetchArtists = async () => {
        try {
            const baseUrl =
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            const response = await fetch(`${baseUrl}/api/artists`)
            if (response.ok) {
                const data = await response.json()
                setArtists(data)
            }
        } catch (error) {
            console.error('Error fetching artists:', error)
        }
    }

    const fetchMusicalGenres = async () => {
        try {
            const baseUrl =
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            const response = await fetch(`${baseUrl}/api/musical-genres`)
            if (response.ok) {
                const data = await response.json()
                setMusicalGenres(data)
            }
        } catch (error) {
            console.error('Error fetching musical genres:', error)
        }
    }

    const addContent = () => {
        setContents(prev => [
            ...prev,
            {
                type: 'IMAGE',
                rank: prev.length + 1,
                uploadType: 'url', // Add default uploadType
            },
        ])
    }

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

    const removeContent = (index: number) => {
        setContents(prev => prev.filter((_, i) => i !== index))
    }

    const updateContent = (index: number, data: Partial<ContentFormData>) => {
        setContents(prev =>
            prev.map((content, i) =>
                i === index ? { ...content, ...data } : content,
            ),
        )
    }

    const resetForm = () => {
        setFormData({
            title: '',
            price: 5,
            downloadLink: '',
            description: '',
            artists: [],
            musicalGenres: [],
            hidden: false,
        })
        setUploadedFiles([])
        setContents([
            {
                type: 'IMAGE',
                url: '',
                file: undefined,
                rank: 1,
                uploadType: 'file',
            },
        ])
        setError('')
        setSuccess('')
    }
    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className='w-full max-w-2xl'>
            <h2 className='mb-6 text-2xl font-bold'>Add New Tablature</h2>
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
                    {/* <label className='block mb-2 text-sm font-medium'>
                        Tablature Files {mode === 'create' ? '*' : ''}
                    </label> */}
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
                        {artists.map(artist => (
                            <option key={artist.id} value={artist.id}>
                                {artist.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Musical Genres
                    </label>
                    <select
                        multiple
                        value={formData.musicalGenres || []}
                        onChange={e => {
                            const selectedOptions = Array.from(
                                e.target.selectedOptions,
                                option => option.value,
                            )
                            setFormData(prev => ({
                                ...prev,
                                musicalGenres: selectedOptions,
                            }))
                        }}
                        className='w-full px-4 py-2 border-2 border-black rounded'
                    >
                        {musicalGenres.map(genre => (
                            <option key={genre.id} value={genre.id}>
                                {genre.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type='button'
                    onClick={() => setShowNewArtistForm(true)}
                    className='mb-4 underline text-purple-dark'
                >
                    + Add New Artist
                </button>

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

            {showNewArtistForm && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                    <div className='bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-scroll'>
                        <AddArtistForm mode='create' />
                        <div className='flex pt-2'>
                            <button
                                type='button'
                                onClick={() => setShowNewArtistForm(false)}
                                className='flex-1 px-4 py-2 text-gray-800 transition-colors rounded bg-red-salmon hover:bg-gray-300'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
