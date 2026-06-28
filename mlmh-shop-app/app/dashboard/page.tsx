import React from 'react'
import AddArtistFormServer from '@/app/components/AddArtistFormServer'
import { SignInButton, Show } from '@clerk/nextjs'
import ListAllItemsServer from '../components/ListAllItemsServer'
import AddTablatureFormServer from '../components/AddTablatureFormServer'
import { redirect } from 'next/navigation'

export const metadata = { robots: { index: false, follow: false } }

type AdminTab = 'tablature' | 'artist' | 'all artists' | 'all tablatures'

interface AdminPageProps {
    searchParams: Promise<{
        tab?: AdminTab
        id?: string
        type?: string
    }>
}

async function setActiveTab(tab: AdminTab) {
    'use server'
    redirect(`/dashboard?tab=${tab}`)
}

const AdminDashboard = ({
    searchParams,
}: {
    searchParams: Awaited<AdminPageProps['searchParams']>
}) => {
    const activeTab: AdminTab = searchParams.tab || 'tablature'
    const id = searchParams.id
    const mode = id ? 'update' : 'create'

    const renderTab = () => {
        switch (activeTab) {
            case 'tablature':
                return <AddTablatureFormServer id={id} mode={mode} />
            case 'artist':
                return <AddArtistFormServer id={id} mode={mode} />
            case 'all artists':
                return <ListAllItemsServer type='artists' />
            case 'all tablatures':
                return <ListAllItemsServer type='tablatures' />
            default:
                return null
        }
    }

    return (
        <div className='flex flex-col justify-start items-center w-full gap-10'>
            <h1 className='text-4xl font-bold text-purple-dark'>
                Admin Dashboard - {mode === 'update' ? 'Update' : 'Create'}
            </h1>
            <div className='w-full max-w-2xl mb-8 flex border-b border-black'>
                <form action={setActiveTab.bind(null, 'tablature')}>
                    <button
                        type='submit'
                        className={`px-6 py-3 text-lg font-medium ${
                            activeTab === 'tablature'
                                ? 'border-b-2 border-purple-dark text-purple-dark'
                                : 'text-gray-600'
                        }`}
                    >
                        {mode === 'update' ? 'Update' : 'Add'} Tablature
                    </button>
                </form>
                <form action={setActiveTab.bind(null, 'artist')}>
                    <button
                        type='submit'
                        className={`px-6 py-3 text-lg font-medium ${
                            activeTab === 'artist'
                                ? 'border-b-2 border-purple-dark text-purple-dark'
                                : 'text-gray-600'
                        }`}
                    >
                        {mode === 'update' ? 'Update' : 'Add'} Artist
                    </button>
                </form>
                <form action={setActiveTab.bind(null, 'all artists')}>
                    <button
                        type='submit'
                        className={`px-6 py-3 text-lg font-medium ${
                            activeTab === 'all artists'
                                ? 'border-b-2 border-purple-dark text-purple-dark'
                                : 'text-gray-600'
                        }`}
                    >
                        See all artists
                    </button>
                </form>
                <form action={setActiveTab.bind(null, 'all tablatures')}>
                    <button
                        type='submit'
                        className={`px-6 py-3 text-lg font-medium ${
                            activeTab === 'all tablatures'
                                ? 'border-b-2 border-purple-dark text-purple-dark'
                                : 'text-gray-600'
                        }`}
                    >
                        See all tablatures
                    </button>
                </form>
            </div>

            {renderTab()}
        </div>
    )
}

export default async function AdminPage(props: AdminPageProps) {
    const searchParams = await props.searchParams;
    return (
        <div className='w-full min-h-full flex flex-col items-center bg-white-oldlace p-10'>
            <Show when="signed-in">
                <AdminDashboard searchParams={searchParams} />
            </Show>
            <Show when="signed-out">
                <SignInButton />
            </Show>
        </div>
    )
}
