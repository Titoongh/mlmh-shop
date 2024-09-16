'use client'
import React from 'react'
import { Button, Tag } from '../Buttons'
import Link from 'next/link'

const MusicCategoriesTags = () => {
    return (
        <div className='flex justify-center items-center'>
            <div className='grid grid-cols-2 justify-center items-center gap-10 tablet:gap-6 phone:gap-4'>
                <Tag className='bg-blue-sky' href='/'>
                    Fingerstyle
                </Tag>
                <Tag className='bg-yellow-khaki' href='/'>
                    Country blues
                </Tag>
                {/* </div>
            <div className='flex justify-start items-center gap-4'> */}
                <Tag className='bg-red-salmon' href='/'>
                    Folk
                </Tag>
                <Tag className='bg-green-darkcyan' href='/'>
                    Fingerpicking
                </Tag>
                {/* </div>
            <div className='flex justify-start items-center gap-4'> */}
                <Tag className='bg-brown-sandy' href='/'>
                    Jazz roots
                </Tag>
                <Tag className='bg-transparent' href='/'>
                    And more
                </Tag>
            </div>
        </div>
    )
}

const Welcome = () => {
    return (
        <>
            <div className='w-full flex flex-col justify-start items-start bg-white-oldlace px-16 tablet:px-8 pt-32 tablet:pt-24 pb-24 tablet:pb-16 border-b-4 border-black'>
                <div className='w-full flex flex-row justify-around items-start gap-10 tablet:gap-4'>
                    <div className='flex flex-col justify-between items-start gap-10'>
                        <div className='text-[3rem] tablet:text-[2rem] phone:text-[1.3rem] font-extrabold phone:font-bold leading-[2.5rem] tablet:leading-[2rem]  phone:leading-[1.3rem] flex flex-col gap-6 tablet:gap-4 phone:gap-2'>
                            <h1>Guitar tablatures,</h1>
                            <h1>Methods,</h1>
                            <h1>Transcriptions,</h1>
                            <h1>& Video lessons.</h1>
                        </div>
                        <Button
                            href='/'
                            className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark text-[1.5rem] px-8 phone:px-4 py-2'
                        >
                            Shop now !
                        </Button>
                    </div>
                    <MusicCategoriesTags />
                </div>
            </div>
        </>
    )
}

export default Welcome
