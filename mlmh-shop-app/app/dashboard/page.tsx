'use client'
import React, { useState, useEffect } from 'react'
import AddTablatureForm from '@/app/components/AddTablatureForm'
import AddArtistForm from '@/app/components/AddArtistForm'
import { useSearchParams } from 'next/navigation'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'

type AdminTab = 'tablature' | 'artist'

const AdminDashboard = () => {
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
        <div className='flex flex-col justify-start items-center'>
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

export default function AdminPage() {
    return (
        <div className='w-full min-h-full flex flex-col items-center bg-white-oldlace p-10'>
            {/* 
            Middleware prevent access to this page if the 
            user is not signed in or does not have sufficient rights.
            So the SignedIn and SignedOut components are not necessary.
            But it is good practice to include them, to prevent displaying 
            the AdminDashboard component to users who are not signed in.
            */}
            <SignedIn>
                <AdminDashboard />
            </SignedIn>
            <SignedOut>
                <SignInButton
                    className={`px-4 py-1 text-white bg-green-darkcyan shadow-base`}
                />
            </SignedOut>
        </div>
    )
}
