'use client'

import { useClerk } from '@clerk/nextjs'

interface AuthPromptModalProps {
    onContinueAsGuest: () => void
    onClose: () => void
}

const benefits = [
    {
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
            </svg>
        ),
        title: 'Re-download anytime',
        desc: 'Access your purchases forever from your account.',
    },
    {
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
            </svg>
        ),
        title: 'Links that never expire',
        desc: 'Guest links expire — account downloads don\'t.',
    },
    {
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
            </svg>
        ),
        title: 'Purchase history',
        desc: 'Everything you\'ve bought in one place.',
    },
]

export default function AuthPromptModal({ onContinueAsGuest, onClose }: AuthPromptModalProps) {
    const { openSignIn, openSignUp } = useClerk()

    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout'

    const handleSignIn = () => {
        onClose()
        openSignIn({ fallbackRedirectUrl: currentUrl, forceRedirectUrl: currentUrl })
    }

    const handleSignUp = () => {
        onClose()
        openSignUp({ fallbackRedirectUrl: currentUrl, forceRedirectUrl: currentUrl })
    }

    return (
        <div className='fixed inset-0 z-50 flex items-end xs:items-center justify-center'>
            <div className='absolute inset-0 bg-black/70' onClick={onClose} />
            <div className='relative bg-white-oldlace w-full xs:max-w-md xs:mx-4 xs:rounded-md border-t-2 xs:border-2 border-black shadow-[0_-4px_0_black] xs:shadow-base overflow-hidden'>

                {/* accent stripe */}
                <div className='h-1.5 bg-orange-khaki w-full' />

                <div className='p-6 sm:p-8'>
                    <button
                        onClick={onClose}
                        className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors'
                        aria-label='Close'
                    >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>

                    <h2 className='text-2xl font-bold mb-4'>
                        Get more with a free account
                    </h2>

                    {/* Featured: simplicity of signup */}
                    <div className='bg-orange-khaki/30 border border-orange-khaki rounded-md px-4 py-3 mb-6 flex items-start gap-3'>
                        <span className='text-xl'>✉️</span>
                        <div>
                            <p className='font-bold text-sm'>Super simple — just an email</p>
                            <p className='text-xs text-gray-600'>No password required. You&apos;ll get a magic link to confirm your email. That&apos;s it.</p>
                        </div>
                    </div>

                    <p className='text-gray-500 text-xs mb-4 uppercase tracking-wide font-semibold'>With an account you also get:</p>
                    <ul className='space-y-4 mb-8'>
                        {benefits.map((b, i) => (
                            <li key={i} className='flex items-start gap-3'>
                                <span className='w-8 h-8 rounded-full bg-purple-dark text-white flex items-center justify-center shrink-0'>
                                    {b.icon}
                                </span>
                                <div>
                                    <p className='font-semibold text-sm'>{b.title}</p>
                                    <p className='text-xs text-gray-500'>{b.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className='space-y-3'>
                        <button
                            onClick={handleSignUp}
                            className='w-full bg-purple-dark text-white font-bold py-3 px-6 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                        >
                            Create a free account
                        </button>
                        <button
                            onClick={handleSignIn}
                            className='w-full border-2 border-black font-medium py-3 px-6 rounded-md hover:bg-black hover:text-white transition-colors'
                        >
                            Sign in
                        </button>
                        <button
                            onClick={onContinueAsGuest}
                            className='w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors'
                        >
                            Continue as guest
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
