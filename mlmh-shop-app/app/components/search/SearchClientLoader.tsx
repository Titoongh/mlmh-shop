'use client'
import dynamic from 'next/dynamic'
import type { SearchClientProps } from './SearchClient'
import { GridSkeleton, Skeleton } from '@/app/components/ui/Skeleton'

// `next/dynamic` with `ssr: false` is only allowed inside a Client Component
// (Next.js 15+). This thin client wrapper preserves the client-only loading of
// SearchClient while letting SearchContainer stay a Server Component.
const SearchClient = dynamic(() => import('./SearchClient'), {
    ssr: false,
    loading: () => (
        <div className='flex w-full max-w-5xl flex-col gap-6 px-4'>
            <Skeleton className='h-12 w-full rounded-full' />
            <div className='flex gap-3'>
                <Skeleton className='h-8 w-24 rounded-full' />
                <Skeleton className='h-8 w-24 rounded-full' />
                <Skeleton className='h-8 w-24 rounded-full' />
            </div>
            <GridSkeleton count={8} />
        </div>
    ),
})

export default function SearchClientLoader(props: SearchClientProps) {
    return <SearchClient {...props} />
}
