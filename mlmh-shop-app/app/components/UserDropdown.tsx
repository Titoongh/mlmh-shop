'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserDropdownProps {
    isAdmin?: boolean
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
    const { user } = useUser()
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await user?.delete()
            router.push('/')
        } catch (err) {
            console.error('Error deleting account:', err)
            setDeleting(false)
        }
    }

    return (
        <div className='fixed inset-0 z-[60] flex items-center justify-center px-4'>
            <div className='absolute inset-0 bg-black/70' onClick={onClose} />
            <div className='relative bg-white-oldlace border-2 border-black rounded-md shadow-base w-full max-w-sm overflow-hidden'>
                <div className='h-1.5 bg-red w-full' />
                <div className='p-6'>
                    <button
                        onClick={onClose}
                        className='absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors'
                    >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>

                    {step === 1 ? (
                        <>
                            <div className='flex items-center gap-3 mb-5'>
                                <div className='w-10 h-10 rounded-full bg-red/10 border-2 border-red flex items-center justify-center shrink-0'>
                                    <svg className='w-5 h-5 text-red' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className='font-bold text-lg'>Delete your account</h2>
                                    <p className='text-xs text-gray-500'>This cannot be undone</p>
                                </div>
                            </div>

                            <div className='bg-black/5 rounded-md p-4 mb-5 space-y-2 text-sm'>
                                <div className='flex justify-between'>
                                    <span className='text-gray-500'>Email</span>
                                    <span className='font-medium truncate max-w-[200px]'>{user?.emailAddresses?.[0]?.emailAddress}</span>
                                </div>
                                {user?.firstName && (
                                    <div className='flex justify-between'>
                                        <span className='text-gray-500'>Name</span>
                                        <span className='font-medium'>{user.firstName} {user.lastName ?? ''}</span>
                                    </div>
                                )}
                            </div>

                            <p className='text-sm text-gray-600 mb-6'>
                                Deleting your account will permanently remove all your data. Your purchase history will be lost and you will no longer be able to re-download your tablatures.
                            </p>

                            <div className='flex gap-3'>
                                <button
                                    onClick={() => setStep(2)}
                                    className='flex-1 bg-red text-white font-bold py-2.5 rounded-md border-2 border-black shadow-small hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-base transition-all text-sm'
                                >
                                    I want to delete
                                </button>
                                <button
                                    onClick={onClose}
                                    className='flex-1 border-2 border-black font-medium py-2.5 rounded-md hover:bg-black hover:text-white transition-colors text-sm'
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className='text-center mb-5'>
                                <div className='w-14 h-14 rounded-full bg-red/10 border-2 border-red flex items-center justify-center mx-auto mb-3'>
                                    <svg className='w-7 h-7 text-red' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                                    </svg>
                                </div>
                                <h2 className='font-bold text-lg'>Are you absolutely sure?</h2>
                                <p className='text-sm text-gray-500 mt-1'>This will permanently delete your account and all associated data.</p>
                            </div>

                            <div className='flex gap-3'>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className='flex-1 bg-red text-white font-bold py-2.5 rounded-md border-2 border-black shadow-small hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-base transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {deleting ? 'Deleting…' : 'Yes, delete forever'}
                                </button>
                                <button
                                    onClick={() => setStep(1)}
                                    className='flex-1 border-2 border-black font-medium py-2.5 rounded-md hover:bg-black hover:text-white transition-colors text-sm'
                                >
                                    Go back
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function UserDropdown({ isAdmin }: UserDropdownProps) {
    const { user } = useUser()
    const { signOut } = useClerk()
    const [open, setOpen] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        setOpen(false)
        await signOut()
        router.push('/')
    }

    const initials = user?.firstName?.[0]?.toUpperCase() ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? '?'

    return (
        <>
            <div ref={ref} className='relative'>
                <button
                    onClick={() => setOpen(o => !o)}
                    className='flex items-center gap-2 group'
                    aria-label='User menu'
                >
                    <span className='w-8 h-8 rounded-full bg-orange-khaki border-2 border-black text-black font-bold text-sm flex items-center justify-center shadow-small group-hover:shadow-base transition-all'>
                        {initials}
                    </span>
                    <svg
                        className={`w-3.5 h-3.5 text-white transition-transform ${open ? 'rotate-180' : ''}`}
                        fill='none' stroke='currentColor' viewBox='0 0 24 24'
                    >
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M19 9l-7 7-7-7' />
                    </svg>
                </button>

                {open && (
                    <div className='absolute right-0 top-12 w-60 bg-black border border-orange-khaki rounded-md shadow-[4px_4px_0px_#FFE18D] z-50 overflow-hidden'>
                        {/* User info */}
                        <div className='px-4 py-3 border-b border-orange-khaki/30 flex items-center justify-between gap-2'>
                            <div className='min-w-0'>
                                <p className='text-white text-sm font-semibold truncate'>
                                    {user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'My account'}
                                </p>
                                <p className='text-gray-400 text-xs truncate'>
                                    {user?.emailAddresses?.[0]?.emailAddress}
                                </p>
                            </div>
                            <button
                                onClick={() => { setOpen(false); setShowDeleteModal(true) }}
                                className='w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-red-salmon hover:bg-white/10 transition-colors shrink-0'
                                title='Account settings'
                            >
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                </svg>
                            </button>
                        </div>

                        <Link
                            href='/user/downloads'
                            onClick={() => setOpen(false)}
                            className='flex items-center gap-3 px-4 py-2.5 text-white hover:bg-orange-khaki/10 transition-colors text-sm'
                        >
                            <svg className='w-4 h-4 text-orange-khaki shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                            </svg>
                            My Downloads
                        </Link>

                        {isAdmin && (
                            <>
                                <div className='border-t border-orange-khaki/30 my-1' />
                                <Link
                                    href='/dashboard'
                                    onClick={() => setOpen(false)}
                                    className='flex items-center gap-3 px-4 py-2.5 text-white hover:bg-orange-khaki/10 transition-colors text-sm'
                                >
                                    <svg className='w-4 h-4 text-orange-khaki shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                                    </svg>
                                    Admin dashboard
                                </Link>
                            </>
                        )}

                        <div className='border-t border-orange-khaki/30 my-1' />
                        <button
                            onClick={handleSignOut}
                            className='w-full flex items-center gap-3 px-4 py-2.5 text-red-salmon hover:bg-orange-khaki/10 transition-colors text-sm text-left'
                        >
                            <svg className='w-4 h-4 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                            </svg>
                            Sign out
                        </button>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
            )}
        </>
    )
}
