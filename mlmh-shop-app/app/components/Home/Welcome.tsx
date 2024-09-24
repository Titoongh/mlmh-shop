'use client'
import React from 'react'
import DefaultButton, { Button } from '../Buttons'
import HomeLayout from './HomeLayout'
import { MainTitle } from '../Texts'

const MusicCategoriesTags = () => {
    return (
        <div className='grid grid-cols-2 gap-3 w-full @container'>
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
        <HomeLayout className='gap-16'>
            <MainTitle>
                Guitar tablatures,
                <br />
                Methods,
                <br />
                Transcriptions,
                <br />& Video lessons.
            </MainTitle>
            <MusicCategoriesTags />
            <div className='w-full'>
                <Button
                    href='/'
                    className='bg-purple-light text-purple-dark shadow-purple-dark border-purple-dark w-full text-lg'
                >
                    Shop now !
                </Button>
            </div>
        </HomeLayout>
    )
}

export default Welcome
