'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SECTIONS = [
    { href: '/admin/tablatures', label: 'Tablatures' },
    { href: '/admin/artists', label: 'Artistes' },
    { href: '/admin/genres', label: 'Genres musicaux' },
] as const

export default function AdminNav() {
    const pathname = usePathname()

    return (
        <nav className='md:w-56 shrink-0'>
            <h1 className='text-2xl font-bold text-purple-dark mb-6'>
                Administration
            </h1>
            <ul className='flex md:flex-col gap-2'>
                {SECTIONS.map(section => {
                    const active = pathname.startsWith(section.href)
                    return (
                        <li key={section.href}>
                            <Link
                                href={section.href}
                                className={cn(
                                    'block px-4 py-2 rounded border-2 font-medium transition-colors',
                                    active
                                        ? 'border-purple-dark bg-purple-dark text-white'
                                        : 'border-black bg-white hover:bg-purple-light',
                                )}
                            >
                                {section.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
