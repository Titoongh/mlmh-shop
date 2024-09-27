import React from 'react'
import { Rock_Salt, Libre_Baskerville } from 'next/font/google'
import classNames from 'classnames'

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
                'flex flex-col justify-center xxs:gap-2 gap-1',
                { 'items-center': props.big, 'items-start': !props.big },
            )}
        >
            <p
                className={classNames(
                    rock_salt.className,
                    'text-orange-khaki',
                    {
                        'text-[0.9rem] xxs:text-[1.2rem] leading-none':
                            !props.big,
                        'text-[1.1rem] xxs:text-[1.5rem]': props.big, // example of different sizes for "big"
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
                        'text-[1.2rem] xxs:text-[1.8rem]': !props.big,
                        'text-[1.4rem] xxs:text-[2rem]': props.big, // example of different sizes for "big"
                    },
                )}
            >
                {'Music House Shop'}
            </p>
        </div>
    )
}

export default LogoText

// import React from 'react'
// import { Rock_Salt, Libre_Baskerville } from 'next/font/google'

// const rock_salt = Rock_Salt({
//     weight: '400',
//     subsets: ['latin'],
// })
// const libre_bv = Libre_Baskerville({
//     weight: '400',
//     subsets: ['latin'],
// })

// const LogoText = (props: { big?: boolean }) => {
//     const itemsPos = props.big ? 'items-center' : 'items-start'
//     const titleSize = props.big
//         ? 'text-[0.9rem] xxs:text-[1.2rem]'
//         : 'text-[0.9rem] xxs:text-[1.2rem]'
//     const subtitleSize = props.big
//         ? 'text-[1.2rem] xxs:text-[1.8rem]'
//         : 'text-[1.2rem] xxs:text-[1.8rem]'

//     return (
//         <div
//             className={`flex flex-col justify-center ${itemsPos} xxs:gap-2 gap-1`}
//         >
//             <p
//                 className={
//                     rock_salt.className +
//                     ` text-orange-khaki leading-none ${titleSize}`
//                 }
//             >
//                 {"Michel Lelong's"}
//             </p>
//             <p
//                 className={
//                     libre_bv.className +
//                     ` text-white  leading-none ${subtitleSize}`
//                 }
//             >
//                 {'Music House Shop'}
//             </p>
//         </div>
//     )
// }

// export default LogoText
