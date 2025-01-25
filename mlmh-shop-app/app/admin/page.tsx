'use client'
import React, { useState, useEffect } from 'react'
import AddTablatureForm from '@/app/components/AddTablatureForm'
import AddArtistForm from '@/app/components/AddArtistForm'
import { useSearchParams } from 'next/navigation'

type AdminTab = 'tablature' | 'artist'

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('tablature')
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const mode = id ? 'update' : 'create'

    useEffect(() => {
        // Set active tab based on URL parameters
        const type = searchParams.get('type')
        if (type === 'artist' || type === 'tablature') {
            setActiveTab(type)
        }
    }, [searchParams])

    return (
        <div className='w-full min-h-full flex flex-col items-center bg-white-oldlace p-10'>
            <h1 className='text-4xl font-bold text-purple-dark mb-10'>
                Admin Dashboard - {mode === 'update' ? 'Update' : 'Create'}
            </h1>

            <div className='w-full max-w-2xl mb-8 flex border-b border-black'>
                <button
                    className={`px-6 py-3 text-lg font-medium ${
                        activeTab === 'tablature'
                            ? 'border-b-2 border-purple-dark text-purple-dark'
                            : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('tablature')}
                >
                    {mode === 'update' ? 'Update' : 'Add'} Tablature
                </button>
                <button
                    className={`px-6 py-3 text-lg font-medium ${
                        activeTab === 'artist'
                            ? 'border-b-2 border-purple-dark text-purple-dark'
                            : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('artist')}
                >
                    {mode === 'update' ? 'Update' : 'Add'} Artist
                </button>
            </div>

            {activeTab === 'tablature' ? (
                <AddTablatureForm id={id} mode={mode} />
            ) : (
                <AddArtistForm id={id} mode={mode} />
            )}
        </div>
    )
}
