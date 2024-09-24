import React from 'react'
import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'

type TextProps = {
    className?: ClassValue
    children: React.ReactNode
}

export const MainTitle = ({ className, children }: TextProps) => {
    return (
        <div className={cn(`text-[2rem] font-extrabold`, className)}>
            {children}
        </div>
    )
}

export const SectionTitle = ({ className, children }: TextProps) => {
    return (
        <div
            className={cn(
                `text-[3rem] font-bold text-black
                tablet:text-[1.5rem]
                phone:text-[0.9rem] phone:font-regular`,
                className,
            )}
        >
            {children}
        </div>
    )
}
