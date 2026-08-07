import { SignUp } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { clerkAppearance } from '@/app/utils/clerkAppearance'

export const metadata: Metadata = {
    title: 'Create your free account',
    robots: { index: false, follow: false },
}

const benefits = [
    {
        title: 'Super simple — just an email',
        desc: 'No password required. You get a magic link to confirm your email.',
    },
    {
        title: 'Re-download anytime',
        desc: 'Access your purchases forever from your account.',
    },
    {
        title: 'Links that never expire',
        desc: 'Guest links expire — account downloads never do.',
    },
    {
        title: 'Purchase history',
        desc: 'Everything you have bought, in one place.',
    },
]

export default function SignUpPage() {
    return (
        <main className='w-full flex items-center justify-center px-4 py-12'>
            <div className='flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 max-w-4xl w-full'>
                <div className='w-full max-w-sm lg:pt-8'>
                    <h1 className='text-3xl font-bold mb-6'>
                        Get more with a free account
                    </h1>
                    <ul className='space-y-4'>
                        {benefits.map(b => (
                            <li key={b.title} className='flex items-start gap-3'>
                                <span className='w-6 h-6 mt-0.5 rounded-full bg-purple-dark text-white flex items-center justify-center shrink-0'>
                                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                                    </svg>
                                </span>
                                <div>
                                    <p className='font-semibold text-sm'>{b.title}</p>
                                    <p className='text-xs text-gray-500'>{b.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <SignUp path='/sign-up' appearance={clerkAppearance} />
            </div>
        </main>
    )
}
