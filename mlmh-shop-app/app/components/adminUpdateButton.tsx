import React from 'react'
import { LinkButton } from './Buttons'
import { Protect } from '@clerk/nextjs'
import Link from 'next/link'

interface UpdateButtonProps {
    href: string
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ href }) => {
    return (
        <Protect permission='org:back_office:edit'>
            <Link href={href} className='underline text-purple-dark'>
                manage
            </Link>
        </Protect>
    )
}

export default UpdateButton
