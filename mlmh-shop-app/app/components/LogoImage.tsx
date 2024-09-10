import Image from 'next/image'
import React from 'react'

const LogoImage = () => {
  return (
    <div className='flex w-[5rem] h-[5rem] rounded-full overflow-hidden border-4 border-white'>
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
