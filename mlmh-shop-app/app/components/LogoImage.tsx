import Image from 'next/image'
import React from 'react'

const LogoImage = () => {
    return (
        <div
            className='
        flex rounded-full overflow-hidden border-white
        xxs:w-[4rem] xxs:h-[4rem] xxs:border-4 
        w-[3rem] h-[3rem] border-2
        '
        >
            <Image
                src='/assets/icon.jpg'
                alt='Drawing of Michel Lelong'
                width={100}
                height={100}
                style={{
                    objectFit: 'cover',
                }}
            />
        </div>
    )
}

export default LogoImage
