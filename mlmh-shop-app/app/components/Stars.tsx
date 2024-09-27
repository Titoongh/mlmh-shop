import Image from 'next/image'
import React from 'react'
import MapsIcon from '../assets/maps.png'

const Star = () => {
    return (
        <svg
            className='text-yellow-500 w-5 h-auto fill-current'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 576 512'
        >
            <path d='M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z' />
        </svg>
    )
}

const Stars = () => {
    return (
        <div className='bg-white border-black border-2 px-4 py-2 rounded-[6px] flex justify-between min-w-full items-stretch'>
            <div className='flex gap-2'>
                <Star />
                <Star />
                <Star />
                <Star />
                <Star />
            </div>
            <a
                className='flex items-center justify-center'
                href="https://www.google.fr/maps/place/Michel+Lelong's+Music+House/@47.3770331,0.659541,13z/data=!4m10!1m2!2m1!1smichel+lelong+guitare!3m6!1s0x47fcd5d1b92db18b:0xccd31183b0b7923d!8m2!3d47.3770331!4d0.6881379!15sChVtaWNoZWwgbGVsb25nIGd1aXRhcmVaFyIVbWljaGVsIGxlbG9uZyBndWl0YXJlkgERZ3VpdGFyX2luc3RydWN0b3LgAQA!16s%2Fg%2F1tgz9qfg?entry=ttu&g_ep=EgoyMDI0MDkyNC4wIKXMDSoASAFQAw%3D%3D"
            >
                <Image
                    src={MapsIcon}
                    alt='google maps icon'
                    height={30}
                    width={40}
                />
            </a>
        </div>
    )
}

export default Stars
