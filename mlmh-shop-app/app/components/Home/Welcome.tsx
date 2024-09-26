import React from 'react'
import { Tag, CTA } from '../Buttons'
import HomeLayout from './HomeLayout'
import { MainTitle } from '../Texts'

const MusicCategoriesTags = () => {
    return (
        <div className='grid grid-cols-2 gap-2 w-full min-w-[200px] max-w-[300px] xxs:max-w-[400px] xl:max-w-[500px]  xxl:max-w-[600px] lg:gap-4'>
            <Tag className='bg-blue-sky' href='/'>
                Fingerstyle
            </Tag>
            <Tag className='bg-yellow-khaki' href='/'>
                <p>Country blues</p>
            </Tag>
            <Tag className='bg-red-salmon' href='/'>
                Folk
            </Tag>
            <Tag className='bg-green-darkcyan' href='/'>
                Fingerpicking
            </Tag>
            <Tag className='bg-brown-sandy' href='/'>
                Jazz roots
            </Tag>
            <Tag className='bg-transparent' href='/'>
                And more
            </Tag>
        </div>
    )
}

const Welcome = () => {
    return (
        <HomeLayout className='flex flex-col justify-start items-start xs:justify-center xs:items-center'>
            <div className='w-full flex flex-col gap-16 justify-center items-center lg:max-w-[800px] xl:max-w-[1100px] xxl:max-w-[1500px]'>
                <div className='w-full flex flex-col gap-16 lg:flex-row lg:gap-10 lg:justify-center lg:items-center'>
                    <MainTitle>
                        Guitar&nbsp;tablatures,
                        <br />
                        Methods,
                        <br />
                        Transcriptions,
                        <br />
                        &&nbsp;Video&nbsp;lessons.
                    </MainTitle>
                    <MusicCategoriesTags />
                </div>
                <div className='w-full flex'>
                    <CTA
                        href='/'
                        className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark '
                    >
                        SHOP NOW !
                    </CTA>
                </div>
            </div>
        </HomeLayout>
    )
}

export default Welcome
