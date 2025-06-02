import React from 'react'
import { Rock_Salt, Libre_Baskerville } from 'next/font/google'
import classNames from 'classnames'
import { Tablature } from '@prisma/client'

const rock_salt = Rock_Salt({
    weight: '400',
    subsets: ['latin'],
})
const libre_bv = Libre_Baskerville({
    weight: '400',
    subsets: ['latin'],
})

const LogoText = (props: { big?: boolean }) => {
    return (
        <div
            className={classNames(
                'flex flex-col justify-center xs:gap-2 gap-1',
                { 'items-center': props.big, 'items-start': !props.big },
            )}
        >
            <p
                className={classNames(
                    rock_salt.className,
                    'text-orange-khaki',
                    {
                        'text-[0.9rem] xs:text-[1.2rem] leading-none':
                            !props.big,
                        'text-[1.1rem] xs:text-[1.5rem]': props.big, // example of different sizes for "big"
                    },
                )}
            >
                {"Michel Lelong's"}
            </p>
            <p
                className={classNames(
                    libre_bv.className,
                    'text-white leading-none',
                    {
                        'text-[1.2rem] xs:text-[1.8rem]': !props.big,
                        'text-[1.4rem] xs:text-[2rem]': props.big, // example of different sizes for "big"
                    },
                )}
            >
                {'Guitar Tab Workshop'}
            </p>
        </div>
    )
}

export default LogoText
