import Image from 'next/image'
import React from 'react'
import { Button, DefaultButton } from './Buttons'
import { Tablature } from '@prisma/client'
import { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'

const ArtistPicture = (props: { image: string }) => {
    return (
        <div
            className='
        flex rounded-full overflow-hidden border-white
        xl:w-[4rem] xl:h-[4rem] xl:border-4
        xxs:w-[3.5rem] xxs:h-[3.5rem] xxs:border-2 
        w-[3rem] h-[3rem] border-2
        '
        >
            <Image
                src={props.image}
                alt='Artist picture'
                width={100}
                height={100}
                style={{
                    objectFit: 'cover',
                }}
            />
        </div>
    )
}

export const ArtistHeader = (props: { name: string; picture: string }) => {
    return (
        <div className='flex justify-center xl:flex-col xl:justify-center items-center w-full gap-2'>
            <ArtistPicture image={props.picture} />
            <h2 className='text-lg xl:flex-1 line-clamp-1'>{props.name}</h2>
        </div>
    )
}

const TabContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='flex justify-center items-center w-[150px] xxs:w-[200px]'>
            {children}
        </div>
    )
}

export const ArtistTablatures = (props: {
    tablatures: Tablature[]
    artistId: string
    className?: ClassValue
}) => {
    return (
        <div
            className={cn(
                'flex-1 flex flex-wrap justify-center gap-2 xxs:gap-4 xl:gap-8',
                props.className,
            )}
        >
            {props.tablatures.map(tablature => (
                <TabContainer key={props.artistId + '-' + tablature.id}>
                    <Button
                        href=''
                        className='bg-white w-full px-4 py-1 xl:py-2 line-clamp-1 rounded-full'
                    >
                        <h3>{tablature.title}</h3>
                    </Button>
                </TabContainer>
            ))}
        </div>
    )
}

export const ArtistCTA = (props: { id: string }) => {
    return (
        <DefaultButton
            href={`/artists/${props.id}`}
            className='px-4 w-full max-w-[150px] py-1 xs:px-4 xl:py-2 rounded-none bg-purple-light'
        >
            See all
        </DefaultButton>
    )
}
