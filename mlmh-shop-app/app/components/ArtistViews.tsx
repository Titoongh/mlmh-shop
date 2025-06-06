import React from 'react'
import { LinkButton, DefaultLink } from './Buttons'
import { Content, Tablature } from '@prisma/client'
import { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import {
    ArtistWithTablaturesAndContents,
    TablatureWithMusicalGenres,
} from '../types/types'
import Link from 'next/link'
import S3Image from './S3Image'

export const ArtistCard = ({
    artist,
    index = 0,
}: {
    artist: ArtistWithTablaturesAndContents
    index?: number
}) => {
    return (
        <Link
            href={`/artists/${artist.id}`}
            className='w-full bg-purple-light/10 rounded-lg p-6 hover:shadow-lg transition-shadow border-2 border-black'
        >
            <div className='flex gap-6'>
                <div className='w-32 h-32 rounded-lg overflow-hidden flex-shrink-0'>
                    {artist.contents?.[0]?.url && (
                        <S3Image
                            src={artist.contents[0].url}
                            alt={artist.name}
                            width={128}
                            height={128}
                            className='object-cover w-full h-full'
                            lazy={index > 6}
                            prefetch={index < 3}
                            priority={index < 3}
                        />
                    )}
                </div>
                <div className='flex flex-col flex-grow gap-3'>
                    <h2 className='text-2xl font-semibold'>{artist.name}</h2>
                    <p className='text-gray-600 line-clamp-2'>
                        {artist.description || 'No description available'}
                    </p>
                    {artist.musicalGenres &&
                        artist.musicalGenres.length > 0 && (
                            <p className='text-sm text-gray-500'>
                                Genres:{' '}
                                {artist.musicalGenres
                                    .map(genre => genre.name)
                                    .join(', ')}
                            </p>
                        )}
                    <div className='flex items-center gap-2 mt-auto'>
                        <span className='text-purple-dark font-medium'>
                            {artist.tablatures.length} tablature
                            {artist.tablatures.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export const TablatureCard = ({
    tablature,
    artist,
    showLetterOverlay = false,
    index = 0,
}: {
    tablature: TablatureWithMusicalGenres
    artist: ArtistWithTablaturesAndContents
    showLetterOverlay?: boolean
    index?: number
}) => {
    return (
        <Link
            href={`/product/tablatures/${tablature.id}`}
            className='w-full bg-green-darkcyan/5 rounded-lg p-4 hover:shadow-lg transition-shadow border-2 border-black'
        >
            <div className='flex gap-4'>
                <div className='w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative'>
                    {artist.contents?.[0]?.url && (
                        <>
                            <S3Image
                                src={artist.contents[0].url}
                                alt={artist.name}
                                width={80}
                                height={80}
                                className='object-cover w-full h-full'
                                lazy={index > 8}
                                prefetch={index < 4}
                                priority={index < 4}
                            />
                            {showLetterOverlay && (
                                <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                                    <span className='text-white font-bold text-2xl'>
                                        {tablature.title
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className='flex flex-col flex-grow gap-2'>
                    <h3 className='text-xl font-medium line-clamp-1'>
                        {tablature.title}
                    </h3>
                    <p className='text-sm text-gray-600'>by {artist.name}</p>
                    {tablature.musicalGenres &&
                        tablature.musicalGenres.length > 0 && (
                            <p className='text-xs text-gray-500'>
                                Genres:{' '}
                                {tablature.musicalGenres
                                    .map(genre => genre.name)
                                    .join(', ')}
                            </p>
                        )}
                    <div className='flex items-center gap-2 mt-auto'>
                        <span className='text-green-darkcyan font-medium'>
                            {formatPrice(tablature.price)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

const ArtistPicture = (props: { image: string | null }) => {
    return (
        <div
            className='
        flex rounded-full overflow-hidden border-white
        xl:w-[4rem] xl:h-[4rem] xl:border-4
        xxs:w-[3.5rem] xxs:h-[3.5rem] xxs:border-2 
        w-[3rem] h-[3rem] border-2
        '
        >
            {props.image !== null && (
                <S3Image
                    src={props.image}
                    alt='Artist picture'
                    width={100}
                    height={100}
                    style={{
                        objectFit: 'cover',
                    }}
                />
            )}
        </div>
    )
}

export const ArtistHeader = (props: { name: string; contents: Content[] }) => {
    return (
        <div className='flex justify-center xl:flex-col xl:justify-center items-center w-full gap-2'>
            {props.contents && props.contents.length > 0 && (
                <ArtistPicture image={props.contents[0].url} />
            )}
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
                    <LinkButton
                        href={`/product/tablatures/${tablature.id}`}
                        color='default'
                        className='w-full px-4 py-1 xl:py-2 line-clamp-1 rounded-full'
                    >
                        <h3>{tablature.title}</h3>
                    </LinkButton>
                </TabContainer>
            ))}
        </div>
    )
}

export const ArtistCTA = (props: { id: string }) => {
    return (
        <DefaultLink
            color='default'
            href={`/artists/${props.id}`}
            className='px-4 w-full max-w-[150px] py-1 xs:px-4 xl:py-2 rounded-none bg-purple-light'
        >
            See all
        </DefaultLink>
    )
}
