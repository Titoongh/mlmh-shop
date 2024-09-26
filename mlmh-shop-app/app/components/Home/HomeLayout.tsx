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
                `w-full
                pt-16 px-6 pb-14
                xxs:px-10 xxs:pt-18 xxs:pb-14
                lg:pt-20 lg:pb-16
                xl:px-24 xl:pt-32 xl:pb-28
                xxl:px-52 xxl:pt-52 xxl:pb-40
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
