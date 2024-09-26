import React from 'react'
import MusicIcon from '../../assets/music.svg'
import Portrait from '../../assets/portrait.jpeg'
import Image from 'next/image'
import { SectionTitle } from '../Texts'
import HomeLayout from './HomeLayout'

const Title = () => {
    return (
        <div className='@container flex justify-start items-center text-purple-dark'>
            <Image
                color='#4C00FF'
                alt='Musical note from partition icon'
                src={MusicIcon}
                className='w-[1.5rem] h-[1.5rem] @xs:w-[2.2rem] @xs:h-[2.2rem] @xl:w-[2.8rem] @xl:h-[2.8rem]'
            />
            <SectionTitle className='text-purple-dark'>
                Musical Bio
            </SectionTitle>
        </div>
    )
}

const Description = () => {
    return (
        <div className='@container w-full'>
            <p className='text-[0.9rem] @xl:text-[1.1rem] leading-[1.5rem] @xl:leading-[2rem]'>
                Teenager, I studied seriously music theory and ear training, and
                I was raise in the american traditionnal music thru my oldest
                brothers who were fond of blues, old-time music, jazz, rag
                etc. I teach guitar professionally since 38 years. In the 90’s,
                I wrote four books for Stefan Grossman’s Guitar Workshop with
                audio lessons on Merle Travis, C.Atkins & J.Reed styles. For a
                french publisher “Play-Music.com” I also made two
                instructionnals videos on Country guitar techniques, Celtic
                guitar techniques and a book with CD of 99 examples on the
                “acoustic” blues guitar techniques and styles… Also I published
                six booklets with audio lessons on guitar fingerstyle techniques
                thru the Mailody Association…
            </p>
        </div>
    )
}

const Bio = () => {
    return (
        <HomeLayout
            className='bg-purple-light 
        flex flex-col justify-start items-start gap-20
        lg:flex-row lg:items-stretch lg:justify-between h-full'
        >
            <div className='w-full h-full flex flex-col gap-10 justify-start max-w-[800px]'>
                <Title />
                <Description />
            </div>
            <div className='w-full min-h-full lg:max-w-[25%] min-w-[300px] flex items-center justify-center'>
                <div className='shadow-base phone:shadow-basePhone max-w-[80vw]'>
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
