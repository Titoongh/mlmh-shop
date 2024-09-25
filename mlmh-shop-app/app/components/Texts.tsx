import React from 'react'
import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'

type TextProps = {
    className?: ClassValue
    children: React.ReactNode
}

export const MainTitle = ({ className, children }: TextProps) => {
    return (
        <div className='@container w-full'>
            <div
                className={cn(
                    `text-[1.9rem] @lg:text-[2.5rem] @xl:text-[3rem] w-full min-w-[280px] font-extrabold`,
                    className,
                )}
            >
                {children}
            </div>
        </div>
    )
}

export const SectionTitle = ({ className, children }: TextProps) => {
    return (
        <div
            className={cn(
                `text-[1.5rem] @xs:text-[2.2rem] @xl:text-[2.8rem] font-bold text-black`,
                className,
            )}
        >
            {children}
        </div>
    )
}
