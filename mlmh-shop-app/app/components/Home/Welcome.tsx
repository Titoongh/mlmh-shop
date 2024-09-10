'use client'
import React from 'react'
import { Button, Tag } from '../Buttons'
import Link from 'next/link'

const MusicCategoriesTags = () => {
    return (
        <div className='flex justify-center items-center mt-6'>
            <div className='flex flex-wrap justify-center items-center gap-10 max-w-[60rem]'>
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
            <div className='w-full flex flex-col justify-start items-start bg-white-oldlace p-16 pt-32 pb-24 border-b-4 border-black'>
                <div className='w-full flex justify-around items-start gap-10'>
                    <div className='flex flex-col justify-between items-start gap-10'>
                        <h1 className='min-w-[30rem] text-[3rem] max-sm:text-[2rem] font-extrabold'>
                            Guitar tablatures,
                            <br />
                            Methods,
                            <br />
                            Transcriptions, <br />& Video lessons.
                        </h1>
                        <Button
                            href='/'
                            className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark text-2xl px-8 py-4'
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
