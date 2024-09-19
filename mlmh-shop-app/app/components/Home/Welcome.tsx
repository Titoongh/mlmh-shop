'use client'
import React from 'react'
import DefaultButton, { Button } from '../Buttons'

const MusicCategoriesTags = () => {
    return (
        <div className='grid grid-cols-2 gap-8 desktop:gap-6 tablet:gap-4 phone:gap-2 w-full max-w-[500px] tablet:max-w-[250px] phone:max-w-[200px]'>
            <DefaultButton className='bg-blue-sky' href='/'>
                Fingerstyle
            </DefaultButton>
            <DefaultButton className='bg-yellow-khaki' href='/'>
                Country blues
            </DefaultButton>
            <DefaultButton className='bg-red-salmon' href='/'>
                Folk
            </DefaultButton>
            <DefaultButton className='bg-green-darkcyan' href='/'>
                Fingerpicking
            </DefaultButton>
            <DefaultButton className='bg-brown-sandy' href='/'>
                Jazz roots
            </DefaultButton>
            <DefaultButton className='bg-transparent' href='/'>
                And more
            </DefaultButton>
        </div>
    )
}

const Title = () => {
    return (
        <h1 className='text-[3.5rem] desktop:text-[2.5rem] tablet:text-[2rem] phone:text-[1rem] font-extrabold phone:font-bold tablet:gap-4 phone:gap-2'>
            Guitar tablatures,
            <br />
            Methods,
            <br />
            Transcriptions,
            <br />& Video lessons.
        </h1>
    )
}

const Welcome = () => {
    return (
        <>
            <div
                className={`
                w-full flex bg-white-oldlace border-black border-b-4
                px-16 pt-32 pb-24 gap-10
                tablet:px-8 tablet:pt-20 tablet:pb-16 tablet:gap-4
                phone:px-4 phone:pt-14 phone:pb-12 phone:gap-2
                `}
            >
                <div className='flex-1 flex justify-center items-center'>
                    <div className='flex flex-col justify-between items-start gap-10 desktop:gap-8 tablet:gap-6 phone:gap-4'>
                        <Title />
                        <Button
                            href='/'
                            className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark w-[50%]'
                        >
                            Shop now !
                        </Button>
                    </div>
                </div>
                <div className='flex-1 flex justify-center items-center'>
                    <MusicCategoriesTags />
                </div>
            </div>
        </>
    )
}

export default Welcome
