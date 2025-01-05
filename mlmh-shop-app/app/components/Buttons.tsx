'use client'
import Link from 'next/link'
import React from 'react'
import { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'

type ButtonColor = keyof typeof colorClasses

type ColorProps = {
    color: ButtonColor
}

type LinkProps = ColorProps & {
    className?: ClassValue
    children: React.ReactNode
    href: string
}

type ButtonProps = ColorProps & {
    className?: ClassValue
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
}

const colorClasses = {
    default: 'border-black bg-white text-black',
    yellow: 'border-yellow-khaki bg-white-oldlace text-black [--shadow-color:theme(colors.yellow-khaki)]',
    purple: 'border-purple-dark bg-purple-light text-black [--shadow-color:theme(colors.purple-dark)]',
    red: 'border-red bg-red-salmon text-black [--shadow-color:red]',
    green: 'border-green-darkcyan bg-green text-black [--shadow-color:theme(colors.green-darkcyan)]',
    disabled: 'border-slate-600 bg-slate-200 text-slate-400',
} as const

const getButtonStyle = ({ color = 'default' }: ColorProps) => {
    return [
        // Base styles
        'text-center cursor-pointer rounded-full border-2',
        colorClasses[color],
        'transition-all',
        'shadow-small lg:shadow-base',

        // Mobile touch behavior (without media query)
        'active:shadow-none',
        'active:translate-x-boxSmallShadowX active:translate-y-boxSmallShadowY',
        'active:lg:translate-x-boxShadowX active:lg:translate-y-boxShadowY',

        // Desktop hover behavior only
        '@media (hover: hover) {',
        'hover:shadow-none',
        'hover:translate-x-boxSmallShadowX hover:translate-y-boxSmallShadowY',
        'hover:lg:translate-x-boxShadowX hover:lg:translate-y-boxShadowY',
        '}',
    ].join(' ')
}

export function DefaultButton({
    className,
    children,
    onClick,
    color,
    disabled,
}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(getButtonStyle({ color }), className)}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

export function DefaultLink({ className, children, href, color }: LinkProps) {
    return (
        <Link href={href} className={cn(getButtonStyle({ color }), className)}>
            {children}
        </Link>
    )
}

export function Tag({
    className,
    children,
    onClick,
    color,
    disabled = false,
}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                cn(getButtonStyle({ color }), className),
                `text-[clamp(12px,1vw,14px)] px-4 py-1`,
            )}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

export function LinkButton({ className, children, href, color }: LinkProps) {
    return (
        <DefaultLink
            href={href}
            color={color}
            className={cn(
                'shadow-small @xs:shadow-base rounded-[6px]',
                className,
            )}
        >
            {children}
        </DefaultLink>
    )
}

export function CTA({ className, children, href, color }: LinkProps) {
    return (
        <DefaultLink
            href={href}
            color={color}
            className={cn(
                className,
                'shadow-small @xs:shadow-base rounded-[6px] min-w-[200px] p-1 xxs:p-2 font-bold text-[1rem] xxs:text-[1.2rem] px-8 xxs:px-8',
            )}
        >
            {children}
        </DefaultLink>
    )
}
// 'use client'
// import Link from 'next/link'
// import React from 'react'
// import { ClassValue } from 'clsx'
// import { cn } from '@/lib/utils'

// type LinkProps = {
//     className?: ClassValue
//     children: React.ReactNode
//     href: string
// }

// type ButtonProps = {
//     className?: ClassValue
//     children: React.ReactNode
//     onClick: () => void
// }

// const LinkAndButtonStyle = `
// text-center cursor-pointer rounded-full
// border-2 border-black bg-orange-khaki
// transition-all hover:shadow-none
// shadow-small hover:translate-x-boxSmallShadowX hover:translate-y-boxSmallShadowY
// lg:shadow-base hover:lg:translate-x-boxShadowX hover:lg:translate-y-boxShadowY
// `

// export function DefaultButton({ className, children, onClick }: ButtonProps) {
//     return (
//         <button onClick={onClick} className={cn(LinkAndButtonStyle, className)}>
//             {children}
//         </button>
//     )
// }

// export function DefaultLink({ className, children, href }: LinkProps) {
//     return (
//         <Link href={href} className={cn(LinkAndButtonStyle, className)}>
//             {children}
//         </Link>
//     )
// }

// export function Tag({ className, children, href }: LinkProps) {
//     return (
//         <DefaultLink
//             href={href}
//             className={cn(className, `text-[clamp(14px,1.5vw,20px)] p-1`)}
//         >
//             {children}
//         </DefaultLink>
//     )
// }

// export function LinkButton({ className, children, href }: LinkProps) {
//     return (
//         <DefaultLink
//             href={href}
//             className={cn(
//                 'shadow-small @xs:shadow-base rounded-[6px]',
//                 className,
//             )}
//         >
//             {children}
//         </DefaultLink>
//     )
// }

// export function CTA({ className, children, href }: LinkProps) {
//     return (
//         <DefaultLink
//             href={href}
//             className={cn(
//                 className,
//                 'shadow-small @xs:shadow-base rounded-[6px] min-w-[200px] p-1 xxs:p-2 font-bold text-[1rem] xxs:text-[1.2rem] px-8 xxs:px-8',
//             )}
//         >
//             {children}
//         </DefaultLink>
//     )
// }
