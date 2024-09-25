import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'
import React from 'react'

type LayoutProps = {
    className?: ClassValue
    children: React.ReactNode
}

const HomeLayout = ({ className, children }: LayoutProps) => {
    return (
        <div
            className={cn(
                `w-full pt-16 px-6 pb-14 xs:px-10 xs:pt-20 xs:pb-16 lg:pt-24 lg:pb-20
                gap-10
                bg-white-oldlace border-black border-b-4
`,
                className,
            )}
        >
            {children}
        </div>
    )
}

export default HomeLayout
