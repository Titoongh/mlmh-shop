import React from 'react'
import { Rock_Salt, Libre_Baskerville } from 'next/font/google'

const rock_salt = Rock_Salt({
    weight: '400',
    subsets: ['latin'],
})
const libre_bv = Libre_Baskerville({
    weight: '400',
    subsets: ['latin'],
})

const LogoText = () => {
    return (
        <div className='flex flex-col justify-center items-start xxs:gap-2 gap-1'>
            <p
                className={
                    rock_salt.className +
                    ' text-orange-khaki text-[0.9rem] xxs:text-[1.2rem] leading-none'
                }
            >
                {"Michel Lelong's"}
            </p>
            <p
                className={
                    libre_bv.className +
                    ' text-white text-[1.2rem] xxs:text-[1.8rem] leading-none'
                }
            >
                {'Music House Shop'}
            </p>
        </div>
    )
}

export default LogoText
