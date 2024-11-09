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
            const response = await fetch('/api/tablatures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
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
            } else {
                setError('Failed to add tablature')
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setLoading(false)
        }
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

    return (
        <div className='w-full max-w-2xl'>
            <h2 className='text-2xl font-bold mb-6'>Add New Tablature</h2>
            {error && (
                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                    {error}
                </div>
            )}
            {success && (
                <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>
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
