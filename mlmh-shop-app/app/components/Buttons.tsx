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

export function DefaultButton({ className, children, href }: Props) {
    return (
        <Link
            href={href}
            className={cn(
                `text-center cursor-pointer rounded-full border-2 border-black bg-orange-khaki transition-all hover:shadow-none 
                shadow-small hover:translate-x-boxSmallShadowX hover:translate-y-boxSmallShadowY 
                lg:shadow-base hover:lg:translate-x-boxShadowX hover:lg:translate-y-boxShadowY
                `,
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
            className={cn(className, `text-[clamp(14px,1.5vw,20px)] p-1`)}
        >
            {children}
        </DefaultButton>
    )
}

export function Button({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={cn(
                'shadow-small @xs:shadow-base rounded-[6px]',
                className,
            )}
        >
            {children}
        </DefaultButton>
    )
}

export function CTA({ className, children, href }: Props) {
    return (
        <DefaultButton
            href={href}
            className={cn(
                className,
                'shadow-small @xs:shadow-base rounded-[6px] min-w-[200px] p-1 xxs:p-2 font-bold text-[1rem] xxs:text-[1.2rem] px-8 xxs:px-8',
            )}
        >
            {children}
        </DefaultButton>
    )
}
