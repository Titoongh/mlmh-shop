import Image from 'next/image'
import React from 'react'

const LogoImage = () => {
    return (
        <div
            className='
        flex rounded-full overflow-hidden border-white
        w-[5rem] h-[5rem] border-4 
        tablet:h-[3.5rem] tablet:w-[3.5rem] tablet:border-2
        phone:h-[2.5rem] phone:w-[2.5rem] 
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
