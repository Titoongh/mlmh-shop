import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faInstagram,
    faYoutubeSquare,
} from '@fortawesome/free-brands-svg-icons'
import { faAt } from '@fortawesome/free-solid-svg-icons'
import LogoText from './LogoText'

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
        </footer>
    )
}

export default Footer
