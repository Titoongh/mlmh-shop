'use client'
import React from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

interface UpdateButtonProps {
    href: string
}

// Clerk v7 removed the `<Protect>` component. This button is rendered inside
// Client Components, so we gate on the client-side `useAuth().has` helper.
const UpdateButton: React.FC<UpdateButtonProps> = ({ href }) => {
    const { has } = useAuth()
    if (!has?.({ role: 'org:admin' })) return null

    return (
        <Link href={href} className='underline text-purple-dark'>
            manage
        </Link>
    )
}

export default UpdateButton
