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
                `w-full flex flex-col justify-start items-start xs:flex-row
                pt-16 px-10 pb-14
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
