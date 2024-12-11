'use client'
import React, { useState } from 'react'
import AddTablatureForm from '@/app/components/AddTablatureForm'
import AddArtistForm from '@/app/components/AddArtistForm'

type AdminTab = 'tablature' | 'artist'

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('tablature')

    return (
        <div className='w-full min-h-full flex flex-col items-center bg-white-oldlace p-10'>
            <h1 className='text-4xl font-bold text-purple-dark mb-10'>
                Admin Dashboard
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
                    Add Tablature
                </button>
                <button
                    className={`px-6 py-3 text-lg font-medium ${
                        activeTab === 'artist'
                            ? 'border-b-2 border-purple-dark text-purple-dark'
                            : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('artist')}
                >
                    Add Artist
                </button>
            </div>

            {activeTab === 'tablature' ? (
                <AddTablatureForm />
            ) : (
                <AddArtistForm />
                // <AddTablatureForm />
            )}
        </div>
    )
}
