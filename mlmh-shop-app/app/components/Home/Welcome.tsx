import React from 'react'
import DefaultButton, { Button } from '../Buttons'
import HomeLayout from './HomeLayout'
import { MainTitle } from '../Texts'

const MusicCategoriesTags = () => {
    return (
        <div className='grid grid-cols-2 gap-3 w-full max-w-[400px] xs:max-w-[500px] lg:gap-6'>
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

const Welcome = () => {
    return (
        <HomeLayout className='flex flex-col justify-start items-start xs:justify-center xs:items-center'>
            <div className='w-full flex flex-col gap-16 justify-center items-center max-w-[1100px]'>
                <div className='w-full flex flex-col gap-16 xs:flex-row xs:gap-4 xs:justify-center xs:items-center'>
                    <MainTitle>
                        Guitar tablatures,
                        <br />
                        Methods,
                        <br />
                        Transcriptions,
                        <br />& Video lessons.
                    </MainTitle>
                    <MusicCategoriesTags />
                </div>
                <div className='w-full'>
                    <Button
                        href='/'
                        className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark'
                    >
                        Shop now !
                    </Button>
                </div>
            </div>
        </HomeLayout>
    )
}

export default Welcome
