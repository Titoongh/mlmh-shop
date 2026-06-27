'use client'
import dynamic from 'next/dynamic'

// `next/dynamic` with `ssr: false` is only allowed inside a Client Component
// (Next.js 15+). This wrapper keeps the Header out of SSR while letting the
// root layout stay a Server Component.
const Header = dynamic(() => import('./Header'), {
    ssr: false,
    loading: () => <div className='bg-black h-28'></div>,
})

export default function HeaderClient() {
    return <Header />
}
