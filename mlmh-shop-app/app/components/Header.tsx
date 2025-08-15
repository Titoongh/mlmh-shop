'use client'
import React, { useEffect, useState } from 'react'
import LogoImage from './LogoImage'
import LogoText from './LogoText'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../hooks/useCart'
import { CartItem } from '../types/types'
import MenuDropdown from './MenuDropdown'
import {
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
    useAuth,
} from '@clerk/nextjs'

const NavLink = ({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) => {
    const pathname = usePathname()
    const isActive =
        pathname === href ||
        (href === '/search' && pathname.startsWith('/product'))

    return (
        <Link
            href={href}
            className={`text-white hover:text-orange-khaki transition-colors ${
                isActive ? 'border-b-2 border-orange-khaki' : ''
            }`}
        >
            {children}
        </Link>
    )
}

const Header = () => {
    const { getItems } = useCart()
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const { has } = useAuth()
    const isAdmin = has?.({ role: 'org:admin' })

    useEffect(() => {
        setCartItems(getItems())
    }, [])

    useEffect(() => {
        // Add event listener for storage changes
        const handleStorageChange = () => {
            setCartItems(getItems())
        }

        if (typeof window === 'undefined') return
        window.addEventListener('storage', handleStorageChange)
        // Custom event for cart updates
        window.addEventListener('cartUpdate', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('cartUpdate', handleStorageChange)
        }
    }, [getItems])

    return (
        <header className='flex justify-between items-center bg-black w-full p-4 xxs:p-6 z-20'>
            <Link
                href='/'
                className='flex justify-start items-center gap-4'
                id='logo'
            >
                <LogoImage />
                <LogoText />
            </Link>

            <nav className='hidden lg:flex items-center gap-4 pr-4'>
                <NavLink href='/'>Home</NavLink>
                <NavLink href='https://www.michel-lelong-music-house.com/'>
                    About Me
                </NavLink>
                <NavLink href='/search'>Shop</NavLink>
                <NavLink href='/checkout'>
                    My Cart {cartItems.length > 0 && `(${cartItems.length})`}
                </NavLink>
                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: 'w-8 h-8',
                                userButtonPopoverCard:
                                    'bg-black border border-orange-khaki',
                                userButtonPopoverFooter: 'hidden',
                            },
                        }}
                        userProfileMode='modal'
                    >
                        <UserButton.MenuItems>
                            <UserButton.Link
                                label='My Downloads'
                                labelIcon={
                                    <svg
                                        className='w-4 h-4'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                        />
                                    </svg>
                                }
                                href='/user/downloads'
                            />
                            {isAdmin && (
                                <UserButton.Link
                                    label='Dashboard'
                                    labelIcon={
                                        <svg
                                            className='w-4 h-4'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                            />
                                        </svg>
                                    }
                                    href='/dashboard'
                                />
                            )}
                            {isAdmin && (
                                <UserButton.Link
                                    label='Organizations'
                                    labelIcon={
                                        <svg
                                            className='w-4 h-4'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6'
                                            />
                                        </svg>
                                    }
                                    href='/organizations'
                                />
                            )}
                            <UserButton.Action label='signOut' />
                        </UserButton.MenuItems>
                    </UserButton>
                </SignedIn>
                <SignedOut>
                    <SignInButton mode='modal'>
                        <button className='text-white hover:text-orange-khaki transition-colors'>
                            Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
            </nav>

            <MenuDropdown cartItemsCount={cartItems.length} />
        </header>
    )
}

export default Header
