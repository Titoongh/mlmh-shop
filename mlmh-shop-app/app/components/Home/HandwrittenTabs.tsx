import React from 'react'
import Handwritten from '../../assets/handwritten.svg'
import Tab from '../../assets/tab.jpg'
import Image from 'next/image'
import { SectionTitle } from '../Texts'
import HomeLayout from './HomeLayout'
import { Button } from '../Buttons'

const Title = () => {
    return (
        <div className='@container flex justify-start items-center'>
            <Image
                color='#4C00FF'
                alt='Hand written tab icon'
                src={Handwritten}
                className='w-[1.5rem] h-[1.5rem] @xs:w-[2.2rem] @xs:h-[2.2rem] @xl:w-[2.8rem] @xl:h-[2.8rem]'
            />
            <SectionTitle className='text-orange'>
                Handwritten Tabs
            </SectionTitle>
        </div>
    )
}

const Description = () => {
    return (
        <div className='@container w-full'>
            <p className='text-[0.9rem] @xl:text-[1.1rem] leading-[1.5rem] @xl:leading-[2rem]'>
                All the tabs are from my hand, my personnal transcriptions, I
                don’t copy the others. The tabs always include rhythm, chord
                diagrams, and fingerings. If you need a tab from my Youtube
                Channel not listed yet on this website, please contact me.
            </p>
        </div>
    )
}

const HandwrittenTabs = () => {
    return (
        <HomeLayout
            className='bg-white-oldlace
        flex flex-col justify-start items-start gap-20
        lg:flex-row-reverse lg:items-stretch h-full'
        >
            <div className='w-full min-h-full flex flex-col justify-between gap-6'>
                <div className='w-full h-full flex flex-col gap-10 justify-start'>
                    <Title />
                    <Description />
                </div>
                <div className='@container w-full flex lg:justify-end items-center'>
                    <Button
                        href='/search?filter=free'
                        className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark'
                    >
                        Check my free tabs
                    </Button>
                </div>
            </div>
            <div className='w-full min-h-full lg:max-w-[33%] flex items-center'>
                <div className='shadow-base phone:shadow-basePhone'>
                    <Image
                        alt='Portrait of Michel Lelong playing guitar'
                        src={Tab}
                    />
                </div>
            </div>
        </HomeLayout>
    )
}

export default HandwrittenTabs
