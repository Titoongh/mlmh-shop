'use client'
import React from 'react'
import { Tag, CTA } from '../Buttons'
import HomeLayout from './HomeLayout'
import { MainTitle } from '../Texts'

const MusicCategoriesTags = () => {
    return (
        <div className='grid grid-cols-2 gap-2 w-full min-w-[200px] max-w-[300px] xxs:max-w-[400px] xl:max-w-[500px]  xxl:max-w-[600px] lg:gap-4'>
            <Tag color='default' className='bg-blue-sky' onClick={() => {}}>
                Fingerstyle
            </Tag>
            <Tag color='default' className='bg-yellow-khaki' onClick={() => {}}>
                <p>Country blues</p>
            </Tag>
            <Tag color='default' className='bg-red-salmon' onClick={() => {}}>
                Folk
            </Tag>
            <Tag
                color='default'
                className='bg-green-darkcyan'
                onClick={() => {}}
            >
                Fingerpicking
            </Tag>
            <Tag color='default' className='bg-brown-sandy' onClick={() => {}}>
                Jazz roots
            </Tag>
            <Tag color='default' className='bg-transparent' onClick={() => {}}>
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
                        href='/search'
                        className='text-purple-dark'
                        color='purple'
                    >
                        SHOP NOW !
                    </CTA>
                </div>
            </div>
        </HomeLayout>
    )
}

export default Welcome
