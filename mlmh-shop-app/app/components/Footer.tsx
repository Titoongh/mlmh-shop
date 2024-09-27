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

// import React from 'react'
// import LogoText from './LogoText'
// import InstaIcon from '../assets/insta.svg'
// import EmailIcon from '../assets/email.svg'
// import YoutubeIcon from '../assets/youtube.svg'
// import Image from 'next/image'

// const Social = (props: { children: React.ReactNode; href: string }) => {
//     return (
//         <a href={props.href} className='min-w-12 h-12'>
//             {props.children}
//         </a>
//     )
// }

// const Socials = () => {
//     return (
//         <div className='flex justify-center items-center'>
//             <Social href='instagram.com'>
//                 <Image
//                     className='border-2'
//                     src={InstaIcon}
//                     alt='Instagram logo'
//                     height={50}
//                     width={50}
//                 />
//             </Social>
//             <Social href='youtube.com'>
//                 <Image
//                     className='border-2'
//                     src={YoutubeIcon}
//                     alt='Instagram logo'
//                     height={50}
//                     width={50}
//                 />
//             </Social>
//             <Social href='m.lelong.music@gmail.com'>
//                 <Image
//                     className='border-2'
//                     src={EmailIcon}
//                     alt='Instagram logo'
//                     height={50}
//                     width={50}
//                 />
//             </Social>
//         </div>
//     )
// }

// const Footer = () => {
//     return (
//         <footer className='flex flex-col justify-start items-center bg-black w-full p-8 pb-6 xxs:p-16'>
//             <LogoText big />
//             <Socials />
//         </footer>
//     )
// }

// export default Footer
