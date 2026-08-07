import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin/auth'
import AdminNav from './components/AdminNav'

export const metadata: Metadata = {
    title: 'Administration — MLMH Shop',
    robots: { index: false, follow: false },
}

// Défense en profondeur : le middleware (proxy.ts) protège déjà /admin, mais
// on revérifie ici côté serveur — et chaque server action revérifie aussi.
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    if (!(await isAdmin())) redirect('/')

    return (
        <div className='w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 px-4 py-8'>
            <AdminNav />
            <main className='flex-1 min-w-0'>{children}</main>
        </div>
    )
}
