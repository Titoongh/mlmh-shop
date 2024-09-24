'use client'
import Link from 'next/link'
import React from 'react'
import { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'

type Props = {
    className?: ClassValue
    children: React.ReactNode
    href: string
}

export default function DefaultButton({ className, children, href }: Props) {
    return (
        <div className='@container w-full text-center flex'>
            <Link
                href={href}
                className={cn(
                    `w-full cursor-pointer rounded-full border-2 border-black bg-orange-khaki transition-all hover:shadow-none 
                    px-1 py-1 text-[1rem] min-w-[120px] shadow-small hover:translate-x-boxSmallShadowX hover:translate-y-boxSmallShadowY 
                    @xs:shadow-base hover:@xs:translate-x-boxShadowX hover:@xs:translate-y-boxShadowY
                    `,
                    className,
                )}
            >
                {children}
            </Link>
        </div>
    )
}

export function Button({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={cn(
                'text-[1.1rem] xs:text-[1.2rem] shadow-small @xs:shadow-base rounded-[6px] max-w-[200px]',
                className,
            )}
        >
            {children}
        </DefaultButton>
    )
}
