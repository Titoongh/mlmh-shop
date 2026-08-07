import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { clerkAppearance } from '@/app/utils/clerkAppearance'

export const metadata: Metadata = {
    title: 'Sign in',
    robots: { index: false, follow: false },
}

export default function SignInPage() {
    return (
        <main className='w-full flex flex-col items-center justify-center gap-6 px-4 py-12'>
            <h1 className='text-3xl font-bold text-center'>Welcome back</h1>
            <SignIn path='/sign-in' appearance={clerkAppearance} />
        </main>
    )
}
