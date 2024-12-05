'use client'
import React, { useEffect, useState } from 'react'
import { Artist } from '@prisma/client'

interface FormData {
    title: string
    price: number
    downloadLink: string
    description?: string
    artistIds: string[]
}

interface NewArtist {
    name: string
    picture: string
    description?: string
}

interface ContentFormData {
    type: 'AUDIO' | 'VIDEO' | 'IMAGE'
    url?: string
    file?: File | undefined
    rank: number
    uploadType: 'url' | 'file'
}

interface ContentItemProps {
    content: ContentFormData
    onUpdate: (data: Partial<ContentFormData>) => void
    onRemove: () => void
}

export function ContentItem({ content, onUpdate, onRemove }: ContentItemProps) {
    return (
        <div className='border-2 border-black p-4 rounded space-y-4'>
            <div className='flex justify-between'>
                <select
                    value={content.type}
                    onChange={e =>
                        onUpdate({
                            type: e.target.value as ContentFormData['type'],
                        })
                    }
                    className='px-4 py-2 border-2 border-black rounded'
                >
                    <option value='IMAGE'>Image</option>
                    <option value='AUDIO'>Audio</option>
                    <option value='VIDEO'>Video</option>
                </select>
                <button
                    type='button'
                    onClick={onRemove}
                    className='text-red-600'
                >
                    Remove
                </button>
            </div>

            <div className='flex gap-4'>
                <label className='flex items-center gap-2'>
                    <input
                        type='radio'
                        checked={content.uploadType === 'url'}
                        onChange={() => onUpdate({ uploadType: 'url' })}
                    />
                    URL
                </label>
                <label className='flex items-center gap-2'>
                    <input
                        type='radio'
                        checked={content.uploadType === 'file'}
                        onChange={() => onUpdate({ uploadType: 'file' })}
                    />
                    File Upload
                </label>
            </div>

            {content.uploadType === 'url' ? (
                <input
                    type='url'
                    value={content.url || ''}
                    onChange={e => onUpdate({ url: e.target.value })}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                    placeholder='Enter URL'
                />
            ) : (
                <input
                    type='file'
                    accept={
                        content.type === 'IMAGE'
                            ? 'image/*'
                            : content.type === 'AUDIO'
                              ? 'audio/*'
                              : 'video/*'
                    }
                    onChange={e => onUpdate({ file: e.target.files?.[0] })}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                />
            )}

            <div className='flex gap-4 items-center'>
                <label>Ranking</label>
                <input
                    type='number'
                    value={content.rank}
                    onChange={e => onUpdate({ rank: parseInt(e.target.value) })}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                    placeholder='Rank'
                />
            </div>
        </div>
    )
}

export default function AddTablatureForm() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [showNewArtistForm, setShowNewArtistForm] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        title: '',
        price: 5,
        downloadLink: '',
        description: '',
        artistIds: [],
    })
    const [newArtist, setNewArtist] = useState<NewArtist>({
        name: '',
        picture: '',
        description: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchArtists()
    }, [])

    const fetchArtists = async () => {
        try {
            const response = await fetch('/api/artists')
            if (response.ok) {
                const data = await response.json()
                setArtists(data)
            }
        } catch (error) {
            console.error('Error fetching artists:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            // First, process all content items
            const processedContents = await handleContentSubmit(e)

            // Then submit everything together
            const response = await fetch('/api/tablatures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    contents: processedContents,
                }),
            })

            if (response.ok) {
                setSuccess('Tablature added successfully!')
                setFormData({
                    title: '',
                    price: 5,
                    downloadLink: '',
                    description: '',
                    artistIds: [],
                })
                setContents([])
            } else {
                setError('Failed to add tablature')
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
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

    const handleNewArtistSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/artists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newArtist),
            })

            if (response.ok) {
                const artist = await response.json()
                setArtists(prev => [...prev, artist])
                setShowNewArtistForm(false)
                setNewArtist({ name: '', picture: '', description: '' })
            } else {
                setError('Failed to add artist')
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const [contents, setContents] = useState<ContentFormData[]>([])

    const handleContentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Handle file uploads first if any
        const contentPromises = contents.map(async (content, index) => {
            if (content.file) {
                const formData = new FormData() // Create new FormData for each file
                formData.append('file', content.file) // Use 'file' as the key

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error(`Upload failed for content ${index + 1}`)
                }

                const { url } = await response.json()
                return {
                    type: content.type,
                    url,
                    rank: content.rank,
                }
            }

            return {
                type: content.type,
                url: content.url,
                rank: content.rank,
            }
        })

        try {
            const processedContents = await Promise.all(contentPromises)
            return processedContents
        } catch (error) {
            console.error('Upload error:', error)
            throw error // Re-throw to be handled by the main submit handler
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

    return (
        <div className='w-full max-w-2xl'>
            <h2 className='text-2xl font-bold mb-6'>Add New Tablature</h2>
            {error && (
                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                    {error}
                </div>
            )}
            {success && (
                <div className='bg-green border-2 border-green-darkcyan text-black px-4 py-3 rounded mb-4'>
                    {success}
                </div>
            )}
            <form onSubmit={handleSubmit} className='space-y-6'>
                <div>
                    <label className='block text-sm font-medium mb-2'>
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
                    <label className='block text-sm font-medium mb-2'>
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
                    <label className='block text-sm font-medium mb-2'>
                        Download Link
                    </label>
                    <input
                        type='url'
                        value={formData.downloadLink}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                downloadLink: e.target.value,
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        required
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium mb-2'>
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
                    <label className='block text-sm font-medium mb-2'>
                        Select Artists
                    </label>
                    <select
                        multiple
                        value={formData.artistIds}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                artistIds: Array.from(
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

                <button
                    type='button'
                    onClick={() => setShowNewArtistForm(true)}
                    className='text-purple-dark underline mb-4'
                >
                    + Add New Artist
                </button>

                <div className='space-y-6'>
                    <div className='flex justify-between items-center'>
                        <label className='block text-sm font-medium mb-2'>
                            Content Items
                        </label>
                        <button
                            type='button'
                            onClick={addContent}
                            className='text-purple-dark underline'
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

                <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-purple-dark text-white py-2 px-4 rounded hover:bg-purple-medium transition-colors'
                >
                    {loading ? 'Adding...' : 'Add Tablature'}
                </button>
            </form>

            {showNewArtistForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                    <div className='bg-white p-6 rounded-lg max-w-md w-full'>
                        <h3 className='text-xl font-bold mb-4'>
                            Add New Artist
                        </h3>
                        <form
                            onSubmit={handleNewArtistSubmit}
                            className='space-y-4'
                        >
                            <div>
                                <label className='block text-sm font-medium mb-2'>
                                    Name
                                </label>
                                <input
                                    type='text'
                                    value={newArtist.name}
                                    onChange={e =>
                                        setNewArtist(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    className='w-full px-4 py-2 border-2 border-black rounded'
                                    required
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium mb-2'>
                                    Picture URL
                                </label>
                                <input
                                    type='url'
                                    value={newArtist.picture}
                                    onChange={e =>
                                        setNewArtist(prev => ({
                                            ...prev,
                                            picture: e.target.value,
                                        }))
                                    }
                                    className='w-full px-4 py-2 border-2 border-black rounded'
                                    required
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium mb-2'>
                                    Description
                                </label>
                                <textarea
                                    value={newArtist.description}
                                    onChange={e =>
                                        setNewArtist(prev => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className='w-full px-4 py-2 border-2 border-black rounded'
                                    rows={4}
                                />
                            </div>

                            <div className='flex gap-4'>
                                <button
                                    type='submit'
                                    disabled={loading}
                                    className='flex-1 bg-purple-dark text-white py-2 px-4 rounded hover:bg-purple-medium transition-colors'
                                >
                                    {loading ? 'Adding...' : 'Add Artist'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setShowNewArtistForm(false)}
                                    className='flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors'
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
