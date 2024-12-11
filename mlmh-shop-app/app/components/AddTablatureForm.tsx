'use client'
import React, { useEffect, useState } from 'react'
import { Artist } from '@prisma/client'
import { ContentFormData, ContentItem, processContents } from './ContentItem'
import AddArtistForm from './AddArtistForm'

interface FormData {
    title: string
    price: number
    downloadLink: string
    description?: string
    artistIds: string[]
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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchArtists()
    }, [showNewArtistForm])

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

    const [contents, setContents] = useState<ContentFormData[]>([])

    const handleContentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const processedContents = await processContents(contents)
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
                    <div className='bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-scroll'>
                        <AddArtistForm />
                        <div className='flex pt-2'>
                            <button
                                type='button'
                                onClick={() => setShowNewArtistForm(false)}
                                className='flex-1 bg-red-salmon text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors'
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
