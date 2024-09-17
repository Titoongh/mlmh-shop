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
                bg-orange-khaki px-2 py-2 phone:p-1 text-[1rem] tablet:text-[0.8rem] phone:text-[0.6rem] shadow-base tablet:shadow-basePhone
                transition-all
                hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none
                hover:tablet:translate-x-boxPhoneShadowX hover:tablet:translate-y-boxPhoneShadowY hover:tablet:shadow-none`,
                className,
            )}
        >
            {children}
        </Link>
    )
}

export function Button({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={cn(className, 'shadow-base rounded-button')}
        >
            {children}
        </DefaultButton>
    )
}
