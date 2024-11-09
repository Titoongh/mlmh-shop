'use client'
import React from 'react'
import AddTablatureForm from '@/app/components/AddTablatureForm'

export default function AdminPage() {
    return (
        <div className='w-full min-h-full flex flex-col items-center bg-white-oldlace p-10'>
            <h1 className='text-4xl font-bold text-purple-dark mb-10'>
                Admin Dashboard
            </h1>
            <AddTablatureForm />
        </div>
    )
}
