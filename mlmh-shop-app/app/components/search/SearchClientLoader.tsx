'use client'
import dynamic from 'next/dynamic'
import type { SearchClientProps } from './SearchClient'

// `next/dynamic` with `ssr: false` is only allowed inside a Client Component
// (Next.js 15+). This thin client wrapper preserves the client-only loading of
// SearchClient while letting SearchContainer stay a Server Component.
const SearchClient = dynamic(() => import('./SearchClient'), {
    ssr: false,
    loading: () => <div>Loading search...</div>,
})

export default function SearchClientLoader(props: SearchClientProps) {
    return <SearchClient {...props} />
}
