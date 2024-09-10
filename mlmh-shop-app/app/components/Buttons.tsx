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
        <Link
            href={href}
            className={cn(
                `flex justify-center cursor-pointer items-center rounded-full border-2 border-black
                bg-orange-khaki px-4 py-2 text-lg shadow-base
                transition-all
                hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none`,
                className,
            )}
        >
            {children}
        </Link>
    )
}

export function Tag({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={`w-[13rem] h-[3rem] ${className}`}
        >
            {children}
        </DefaultButton>
    )
}

export function Button({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={`${className} shadow-base rounded-base`}
        >
            {children}
        </DefaultButton>
    )
}
