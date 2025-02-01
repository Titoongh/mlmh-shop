'use client'
import React, { useEffect, useState } from 'react'
import LogoImage from './LogoImage'
import LogoText from './LogoText'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../hooks/useCart'
import { CartItem } from '../types/types'
import MenuDropdown from './MenuDropdown'
import { SignedIn, SignOutButton } from '@clerk/nextjs'
import { Sign } from 'crypto'

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
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setCartItems(getItems())
        setIsLoading(false)
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
        setIsLoading(false)

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
                <NavLink href='/search'>Shop</NavLink>
                <NavLink href='/checkout'>
                    My Cart {cartItems.length > 0 && `(${cartItems.length})`}
                </NavLink>
                <SignedIn>
                    <NavLink href='/dashboard'>Dashboard</NavLink>
                    <SignOutButton
                        className={`text-red-salmon transition-colors pl-8`}
                    />
                </SignedIn>
            </nav>

            <MenuDropdown cartItemsCount={cartItems.length} />
        </header>
    )
}

export default Header
