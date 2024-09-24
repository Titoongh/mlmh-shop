import React from 'react'
import MusicIcon from '../../assets/music.svg'
import Portrait from '../../assets/portrait.jpeg'
import Image from 'next/image'
import { SectionTitle } from '../Texts'
import HomeLayout from './HomeLayout'

const Title = () => {
    return (
        <div className='flex justify-start items-center text-purple-dark'>
            <Image
                color='#4C00FF'
                alt='Musical note from partition icon'
                src={MusicIcon}
                className='w-[3.5rem] h-[3.5rem]'
            />
            <SectionTitle className='text-purple-dark'>
                Musical Bio
            </SectionTitle>
        </div>
    )
}

const Description = () => {
    return (
        <p className='text-[1rem] phone:text-[0.9rem] leading-[2rem] phone:leading-[1.5rem] max-w-[40vw] tablet:max-w-[70vw] phone:max-w-[90vw]'>
            Teenager, I studied seriously music theory and ear training, and I
            was raise in the american traditionnal music thru my oldest brothers
            who were fond of blues, old-time music, jazz, rag etc. I teach
            guitar professionally since 38 years. In the 90’s, I wrote four
            books for Stefan Grossman’s Guitar Workshop with audio lessons
            on Merle Travis, C.Atkins & J.Reed styles. For a french
            publisher “Play-Music.com” I also made two instructionnals videos on
            Country guitar techniques, Celtic guitar techniques and a book with
            CD of 99 examples on the “acoustic” blues guitar techniques and
            styles… Also I published six booklets with audio lessons on guitar
            fingerstyle techniques thru the Mailody Association…
        </p>
    )
}

const Bio = () => {
    return (
        <HomeLayout className='bg-purple-light tablet:flex-col'>
            <div className='flex-1 flex flex-col gap-4 justify-center max-w-[40vw] tablet:max-w-[70vw] phone:max-w-[90vw]'>
                {/* <div className='max-w-[40vw] tablet:max-w-[70vw] phone:max-w-[90vw]'> */}
                <Title />
                <Description />
                {/* </div> */}
            </div>
            <div className='flex-1 flex justify-center items-center w-full'>
                <div className='shadow-base phone:shadow-basePhone max-w-[25vw] tablet:max-w-[70vw] phone:max-w-[90vw] h-auto'>
                    <Image
                        alt='Portrait of Michel Lelong playing guitar'
                        src={Portrait}
                    />
                </div>
            </div>
        </HomeLayout>
    )
}

export default Bio
