import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faInstagram,
    faYoutubeSquare,
} from '@fortawesome/free-brands-svg-icons'
import { faAt } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import LogoText from './LogoText'

const FooterNav = () => {
    return (
        <nav className='mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80'>
            <Link href='/about' className='hover:text-white'>
                About Michel Lelong
            </Link>
            <Link href='/search' className='hover:text-white'>
                Tablatures
            </Link>
            <Link href='/conditions' className='hover:text-white'>
                Terms
            </Link>
        </nav>
    )
}

const Social = (props: { children: React.ReactNode; href: string }) => {
    return (
        <a
            href={props.href}
            className='h-10 w-10 flex flex-col justify-center items-center'
        >
            {props.children}
        </a>
    )
}

const Socials = () => {
    return (
        <div className='flex justify-center items-center gap-8 mt-4'>
            <Social href='https://instagram.com'>
                <FontAwesomeIcon
                    icon={faInstagram}
                    className='text-white'
                    size='xs'
                />
            </Social>
            <Social href='https://youtube.com'>
                <FontAwesomeIcon
                    icon={faYoutubeSquare}
                    className='text-white'
                    size='1x'
                />
            </Social>
            <Social href='mailto:m.lelong.music@gmail.com'>
                <FontAwesomeIcon icon={faAt} className='text-white' size='1x' />
            </Social>
        </div>
    )
}

const Footer = () => {
    return (
        <footer className='flex flex-col justify-start items-center bg-black w-full p-8 pb-6 xxs:p-16'>
            <LogoText big />
            <Socials />
            <FooterNav />
        </footer>
    )
}

export default Footer
