'use client'

import { useClerk } from '@clerk/nextjs'

interface AuthPromptModalProps {
    onContinueAsGuest: () => void
    onClose: () => void
}

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
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
            <div className='absolute inset-0 bg-black/60' onClick={onClose} />
            <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8'>
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                </button>

                <h2 className='text-xl font-bold text-gray-900 mb-2'>
                    Create a free account to get more
                </h2>
                <p className='text-gray-500 text-sm mb-6'>
                    You can checkout as a guest, but with an account you get:
                </p>

                <ul className='space-y-3 mb-8'>
                    <li className='flex items-start gap-3'>
                        <svg className='w-5 h-5 text-green-500 mt-0.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                        <span className='text-sm text-gray-700'>
                            <strong>Re-download anytime</strong> — access your purchases forever from your account
                        </span>
                    </li>
                    <li className='flex items-start gap-3'>
                        <svg className='w-5 h-5 text-green-500 mt-0.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                        <span className='text-sm text-gray-700'>
                            <strong>No lost links</strong> — guest download links expire, account downloads don&apos;t
                        </span>
                    </li>
                    <li className='flex items-start gap-3'>
                        <svg className='w-5 h-5 text-green-500 mt-0.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                        <span className='text-sm text-gray-700'>
                            <strong>Purchase history</strong> — see everything you&apos;ve bought in one place
                        </span>
                    </li>
                </ul>

                <div className='space-y-3'>
                    <button
                        onClick={handleSignUp}
                        className='w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors'
                    >
                        Create a free account
                    </button>
                    <button
                        onClick={handleSignIn}
                        className='w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors'
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
    )
}
