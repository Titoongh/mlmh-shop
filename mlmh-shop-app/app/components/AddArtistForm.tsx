'use client'
import React, { useEffect, useState } from 'react'
import { MusicalGenre } from '@prisma/client'
import { ContentItem, processContents } from './ContentItem'
import type { ContentFormData } from './ContentItem'

interface FormData {
    name: string
    description?: string
    musicalGenres: string[]
}

interface AddArtistFormProps {
    id?: string | null
    mode: 'create' | 'update'
}

export default function AddArtistForm({
    id,
    mode = 'create',
}: AddArtistFormProps) {
    // Add loading state for initial data
    const [isLoading, setIsLoading] = useState(true)
    const [picture, setPicture] = useState<ContentFormData>({
        type: 'IMAGE',
        url: '',
        file: undefined,
        rank: 1,
        uploadType: 'file',
    })
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        musicalGenres: [],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [musicalGenres, setMusicalGenres] = useState<MusicalGenre[]>([])
    const [showNewGenreForm, setShowNewGenreForm] = useState(false)
    const [newGenre, setNewGenre] = useState('')

    // Fetch artist data if in update mode
    useEffect(() => {
        if (mode === 'update' && id) {
            fetchArtistData(id)
        } else {
            setIsLoading(false)
        }
    }, [id, mode])

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            musicalGenres: [],
        })
        setPicture({
            type: 'IMAGE',
            url: '',
            file: undefined,
            rank: 1,
            uploadType: 'file',
        })
        setError('')
        setSuccess('')
    }

    const fetchArtistData = async (artistId: string) => {
        try {
            const baseUrl =
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            const response = await fetch(`${baseUrl}/api/artists/${artistId}`)
            if (response.ok) {
                const artist = await response.json()
                setFormData({
                    name: artist.name,
                    description: artist.description || '',
                    musicalGenres: artist.musicalGenres.map(
                        (g: MusicalGenre) => g.id,
                    ),
                })
                if (artist.contents?.[0]) {
                    setPicture({
                        type: 'IMAGE',
                        url: artist.contents[0].url,
                        rank: 1,
                        uploadType: 'url',
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching artist:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const processedPictureContent = await handleContentSubmit(e)
            const url =
                mode === 'update' ? `/api/artists/${id}` : '/api/artists'
            const method = mode === 'update' ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    contents: processedPictureContent,
                }),
            })
            console.log('response', response)

            if (response.ok) {
                if (mode === 'create') {
                    // Only reset form for create mode
                    resetForm()
                }
                setSuccess(
                    `Artist ${
                        mode === 'update' ? 'updated' : 'added'
                    } successfully!`,
                )
            } else {
                setError(`Failed to ${mode} artist`)
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchMusicalGenres()
    }, [])

    const fetchMusicalGenres = async () => {
        try {
            const response = await fetch('/api/musical-genres')
            if (response.ok) {
                const data = await response.json()
                setMusicalGenres(data)
            }
        } catch (error) {
            console.error('Error fetching artists:', error)
        }
    }

    const handleContentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const processedContents = await processContents([picture])
            return processedContents
        } catch (error) {
            console.error('Upload error:', error)
            throw error
        }
    }

    const handleNewGenreSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/musical-genres', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newGenre }),
            })

            if (response.ok) {
                const genre = await response.json()
                setMusicalGenres(prev => [...prev, genre])
                setShowNewGenreForm(false)
                setNewGenre('')
            } else {
                setError('Failed to add genre')
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className='w-full max-w-2xl'>
            <h2 className='mb-6 text-2xl font-bold'>Add New Artist</h2>
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
            {!isLoading && (
                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div>
                        <label className='block mb-2 text-sm font-medium'>
                            Name *
                        </label>
                        <input
                            type='text'
                            value={formData.name}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className='w-full px-4 py-2 border-2 border-black rounded'
                            required
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
                            Musical Genres
                        </label>
                        <select
                            multiple
                            value={formData.musicalGenres}
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
                        onClick={() => setShowNewGenreForm(true)}
                        className='mb-4 underline text-purple-dark'
                    >
                        + Add New Genre
                    </button>
                    <div className='space-y-6'>
                        <div>
                            <label className='block mb-2 text-sm font-medium'>
                                Picture *
                            </label>
                            <ContentItem
                                content={picture}
                                onUpdate={data =>
                                    setPicture(prev => ({ ...prev, ...data }))
                                }
                                onRemove={() =>
                                    setPicture({
                                        type: 'IMAGE',
                                        url: '',
                                        file: undefined,
                                        rank: 1,
                                        uploadType: 'file',
                                    })
                                }
                                imageOnly
                            />
                        </div>
                    </div>
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full px-4 py-2 text-white transition-colors rounded bg-purple-dark hover:bg-purple-medium'
                    >
                        {loading ? 'Adding...' : 'Add Artist'}
                    </button>
                </form>
            )}

            {showNewGenreForm && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                    <div className='w-full max-w-md p-6 bg-white rounded-lg'>
                        <h3 className='mb-4 text-xl font-bold'>
                            Add New Genre
                        </h3>
                        <form
                            onSubmit={handleNewGenreSubmit}
                            className='space-y-4'
                        >
                            <div>
                                <label className='block mb-2 text-sm font-medium'>
                                    Name
                                </label>
                                <input
                                    type='text'
                                    value={newGenre}
                                    onChange={e => setNewGenre(e.target.value)}
                                    className='w-full px-4 py-2 border-2 border-black rounded'
                                    required
                                />
                            </div>

                            <div className='flex gap-4'>
                                <button
                                    type='submit'
                                    disabled={loading}
                                    className='flex-1 px-4 py-2 text-white transition-colors rounded bg-purple-dark hover:bg-purple-medium'
                                >
                                    {loading ? 'Adding...' : 'Add Genre'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setShowNewGenreForm(false)}
                                    className='flex-1 px-4 py-2 text-gray-800 transition-colors bg-gray-200 rounded hover:bg-gray-300'
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
