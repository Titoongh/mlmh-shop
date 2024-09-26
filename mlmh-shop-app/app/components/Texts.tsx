import React from 'react'
import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'

type TextProps = {
    className?: ClassValue
    children: React.ReactNode
}

export const MainTitle = ({ className, children }: TextProps) => {
    return (
        <div
            className={cn(
                `text-[clamp(30px,3vw,100px)] xxs:text-[clamp(45px,3vw,100px)] w-full font-extrabold`,
                className,
            )}
        >
            {children}
        </div>
    )
}

export const SectionTitle = ({ className, children }: TextProps) => {
    return (
        <div
            className={cn(
                `text-[clamp(30px,2.8vw,70px)] xxs:text-[clamp(40px,2.8vw,70px)] font-bold text-black`,
                className,
            )}
        >
            {children}
        </div>
    )
}
