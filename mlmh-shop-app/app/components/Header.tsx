'use client'
import React, { useEffect, useState } from 'react'
import LogoImage from './LogoImage'
import LogoText from './LogoText'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../hooks/useCart'
import { CartItem } from '../types/types'
import MenuDropdown from './MenuDropdown'
import UserDropdown from './UserDropdown'
import { useAuth } from '@clerk/nextjs'

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
    const { has, isLoaded, isSignedIn } = useAuth()
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
                <NavLink href='/about'>About Me</NavLink>
                <NavLink href='/search'>Shop</NavLink>
                <Link
                    href='/checkout'
                    className='relative flex items-center gap-2 text-white border-2 border-white/30 hover:border-orange-khaki hover:text-orange-khaki px-3 py-1.5 rounded-md transition-all'
                >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                    <span className='text-sm font-medium'>My Cart</span>
                    {cartItems.length > 0 && (
                        <span className='absolute -top-2 -right-2 w-5 h-5 bg-orange-khaki text-black text-xs font-bold rounded-full flex items-center justify-center border border-black'>
                            {cartItems.length}
                        </span>
                    )}
                </Link>
                {isSignedIn && <UserDropdown isAdmin={isAdmin ?? false} />}
                {isLoaded && !isSignedIn && (
                    <Link
                        href='/sign-in'
                        className='flex items-center gap-2 bg-orange-khaki text-black font-bold text-sm px-4 py-2 rounded-md border-2 border-black shadow-small hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-base transition-all'
                    >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                        Sign in
                    </Link>
                )}
            </nav>

            <MenuDropdown cartItemsCount={cartItems.length} />
        </header>
    )
}

export default Header
