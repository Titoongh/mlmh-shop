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
                bg-orange-khaki px-2 py-2 text-[1rem] tablet:text-[0.8rem] phone:text-[0.7rem] shadow-base tablet:shadow-basePhone
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

export function Tag({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={`w-[10rem] tablet:w-[7.5rem] phone:w-[6.5rem] h-[3rem] tablet:h-[2rem] phone:h-[1.5rem] ${className}`}
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
