'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { SignOutButton, OrganizationSwitcher, useAuth } from '@clerk/nextjs'

export default function MenuDropdown({
    cartItemsCount,
}: {
    cartItemsCount: number
}) {
    const [isActive, setIsActive] = useState(false)
    const pathname = usePathname()
    const { has, isLoaded, isSignedIn } = useAuth()
    const isAdmin = has?.({ role: 'org:admin' })

    const isActivePath = (path: string) =>
        pathname === path ||
        (path === '/search' && pathname.startsWith('/product'))

    return (
        <div
            data-state={isActive ? 'open' : 'closed'}
            className='relative lg:hidden group' // Added 'group' class here
            aria-expanded={isActive}
        >
            <button
                onClick={() => setIsActive(!isActive)}
                onBlur={() => setIsActive(false)}
                aria-label='Menu'
                className='text-white hover:text-orange-khaki transition-colors'
            >
                <Menu className='w-6 h-6' />
            </button>
            <div
                role='menu'
                className='absolute right-0 w-48 overflow-hidden
                group-data-[state=open]:top-12 group-data-[state=open]:opacity-100 
                group-data-[state=closed]:invisible group-data-[state=closed]:top-[50px] 
                group-data-[state=closed]:opacity-0 group-data-[state=open]:visible 
                rounded-md bg-black border border-orange-khaki shadow-lg 
                transition-all duration-200'
            >
                <Link
                    href='/'
                    className={`block px-4 py-2 text-white hover:bg-orange-khaki/10 
                        ${
                            isActivePath('/')
                                ? 'border-l-2 border-orange-khaki'
                                : ''
                        }`}
                >
                    Home
                </Link>
                <Link
                    href='/about'
                    className={`block px-4 py-2 text-white hover:bg-orange-khaki/10
                        ${
                            isActivePath('/about')
                                ? 'border-l-2 border-orange-khaki'
                                : ''
                        }`}
                >
                    About Me
                </Link>
                <Link
                    href='/search'
                    className={`block px-4 py-2 text-white hover:bg-orange-khaki/10 
                        ${
                            isActivePath('/search')
                                ? 'border-l-2 border-orange-khaki'
                                : ''
                        }`}
                >
                    Shop
                </Link>
                <Link
                    href='/checkout'
                    className={`block px-4 py-2 text-white hover:bg-orange-khaki/10 
                        ${
                            isActivePath('/checkout')
                                ? 'border-l-2 border-orange-khaki'
                                : ''
                        }`}
                >
                    My Cart {cartItemsCount > 0 && `(${cartItemsCount})`}
                </Link>
                {isSignedIn && (
                    <>
                    {isAdmin && (
                        <div className='px-4 py-2 border-b border-orange-khaki'>
                            <OrganizationSwitcher
                                afterCreateOrganizationUrl='/dashboard'
                                afterSelectOrganizationUrl='/dashboard'
                                afterLeaveOrganizationUrl='/dashboard'
                                createOrganizationMode='modal'
                                organizationProfileMode='modal'
                                appearance={{
                                    elements: {
                                        organizationSwitcherTrigger:
                                            'text-white hover:text-orange-khaki transition-colors w-full text-left',
                                        organizationSwitcherPopoverCard:
                                            'bg-black border border-orange-khaki',
                                        organizationSwitcherPopoverFooter: 'hidden',
                                    },
                                }}
                            />
                        </div>
                    )}
                    <Link
                        href='/user/downloads'
                        className={`block px-4 py-2 text-white hover:bg-orange-khaki/10 
                            ${
                                isActivePath('/user/downloads')
                                    ? 'border-l-2 border-orange-khaki'
                                    : ''
                            }`}
                    >
                        My Downloads
                    </Link>
                    {isAdmin && (
                        <Link
                            href='/organizations'
                            className={`block px-4 py-2 text-white hover:bg-orange-khaki/10 
                                ${
                                    isActivePath('/organizations')
                                        ? 'border-l-2 border-orange-khaki'
                                        : ''
                                }`}
                        >
                            Organizations
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            href='/dashboard'
                            className={`block px-4 py-2 text-white hover:bg-orange-khaki/10 
                                ${
                                    isActivePath('/dashboard')
                                        ? 'border-l-2 border-orange-khaki'
                                        : ''
                                }`}
                        >
                            Dashboard
                        </Link>
                    )}
                    <SignOutButton>
                        <button
                            className={`block px-4 py-2 text-red-salmon hover:bg-orange-khaki/10 w-full text-left`}
                        >
                            Sign out
                        </button>
                    </SignOutButton>
                    </>
                )}
                {isLoaded && !isSignedIn && (
                    <Link
                        href='/sign-in'
                        className='block px-4 py-2 text-white hover:bg-orange-khaki/10 w-full text-left'
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </div>
    )
}
