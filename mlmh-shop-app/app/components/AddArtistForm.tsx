'use client'
import React, { useEffect, useState } from 'react'
import { MusicalGenre, Gender } from '@prisma/client'
import { ContentItem, processContents } from './ContentItem'
import type { ContentFormData } from './ContentItem'

interface FormData {
    name: string
    firstName?: string
    lastName?: string
    gender?: Gender | undefined
    description?: string
    musicalGenres: string[]
}

export default function AddArtistForm() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        firstName: '',
        lastName: '',
        gender: undefined,
        description: '',
        musicalGenres: [],
    })
    const [picture, setPicture] = useState<ContentFormData>({
        type: 'IMAGE',
        url: '',
        file: undefined,
        rank: 1,
        uploadType: 'file',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [musicalGenres, setMusicalGenres] = useState<MusicalGenre[]>([])
    const [showNewGenreForm, setShowNewGenreForm] = useState(false)
    const [newGenre, setNewGenre] = useState('')
    const genderOptions = Object.values(Gender)

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const processedPictureContent = await handleContentSubmit(e)

            const response = await fetch('/api/artists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    contents: processedPictureContent,
                }),
            })

            if (response.ok) {
                setSuccess('Artist added successfully!')
                setFormData({
                    name: '',
                    firstName: '',
                    lastName: '',
                    gender: undefined,
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
            } else {
                setError('Failed to add artist')
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
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
                console.log('genre', genre)
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

    return (
        <div className='w-full max-w-2xl'>
            <h2 className='text-2xl font-bold mb-6'>Add New Artist</h2>
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
                    <label className='block text-sm font-medium mb-2'>
                        First Name
                    </label>
                    <input
                        type='text'
                        value={formData.firstName}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                firstName: e.target.value,
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium mb-2'>
                        Last Name
                    </label>
                    <input
                        type='text'
                        value={formData.lastName}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                lastName: e.target.value,
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium mb-2'>
                        Genre
                    </label>
                    <select
                        value={formData.gender || ''}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                gender: e.target.value
                                    ? (e.target.value as Gender)
                                    : undefined,
                            }))
                        }
                        className='w-full px-4 py-2 border-2 border-black rounded'
                    >
                        <option value=''>Select a gender</option>
                        {genderOptions.map(gender => (
                            <option key={gender} value={gender}>
                                {gender.charAt(0) +
                                    gender.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </select>
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
                        Musical Genres
                    </label>
                    <select
                        multiple
                        value={formData.musicalGenres}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                musicalGenres: Array.from(
                                    e.target.selectedOptions,
                                    option => option.value,
                                ),
                            }))
                        }
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
                    className='text-purple-dark underline mb-4'
                >
                    + Add New Genre
                </button>
                <div className='space-y-6'>
                    <div>
                        <label className='block text-sm font-medium mb-2'>
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
                    className='w-full bg-purple-dark text-white py-2 px-4 rounded hover:bg-purple-medium transition-colors'
                >
                    {loading ? 'Adding...' : 'Add Artist'}
                </button>
            </form>

            {showNewGenreForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                    <div className='bg-white p-6 rounded-lg max-w-md w-full'>
                        <h3 className='text-xl font-bold mb-4'>
                            Add New Genre
                        </h3>
                        <form
                            onSubmit={handleNewGenreSubmit}
                            className='space-y-4'
                        >
                            <div>
                                <label className='block text-sm font-medium mb-2'>
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
                                    className='flex-1 bg-purple-dark text-white py-2 px-4 rounded hover:bg-purple-medium transition-colors'
                                >
                                    {loading ? 'Adding...' : 'Add Genre'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setShowNewGenreForm(false)}
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
