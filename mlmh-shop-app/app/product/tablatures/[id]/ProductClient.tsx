'use client'
import React, { useState } from 'react'
import { Content } from '@prisma/client'
import {
    ArtistWithContents,
    productType,
    TablatureProduct,
} from '../../../types/types'
import { Swiper, SwiperClass, SwiperSlide, useSwiper } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/scrollbar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowAltCircleLeft,
    faArrowAltCircleRight,
    faChevronDown,
    faMusic,
    faVideo,
} from '@fortawesome/free-solid-svg-icons'
import { DefaultButton } from '../../../components/Buttons'
import { useWindowSize } from '../../../hooks/useWindowSize'
import { useCart } from '../../../hooks/useCart'
import { usePurchases } from '../../../hooks/usePurchases'
import UpdateButton from '../../../components/adminButtons'
import S3Image from '../../../components/S3Image'
import S3Audio from '../../../components/S3Audio'
import Link from 'next/link'

const FocusedAttachement = (props: {
    content: Content
    onPrevClick: () => void
    onNextClick: () => void
}) => {
    const renderContent = () => {
        if (!props.content.url) return null

        switch (props.content.type) {
            case 'IMAGE':
                return <ImageContent url={props.content.url} />
            case 'VIDEO':
                return <VideoContent url={props.content.url} />
            case 'AUDIO':
                return <AudioContent url={props.content.url} />
            default:
                return null
        }
    }

    return (
        <div className='w-full max-w-[380px] h-[380px] border-2 border-black flex flex-col justify-start items-center border-collapse shadow-base'>
            <div className='flex items-center justify-start w-full h-20 pl-6 text-xl border-b-2 border-black bg-white-oldlace'>
                Tablature
            </div>
            <div className='relative flex items-center justify-center w-full h-full bg-black'>
                {renderContent()}
                <div
                    className='absolute text-white cursor-pointer left-2'
                    onClick={props.onPrevClick}
                >
                    <FontAwesomeIcon
                        icon={faArrowAltCircleLeft}
                        className='text-white'
                        size='2xl'
                    />
                </div>
                <div
                    className='absolute text-white cursor-pointer right-2'
                    onClick={props.onNextClick}
                >
                    <FontAwesomeIcon
                        icon={faArrowAltCircleRight}
                        className='text-white'
                        size='2xl'
                    />
                </div>
            </div>
        </div>
    )
}

// Create a SwiperNavigation component that will handle the slide navigation
const SwiperNavigation = ({
    index,
    setSelectedIndex,
}: {
    index: number
    setSelectedIndex: (value: number) => void
}) => {
    const swiper = useSwiper()

    return (
        <div
            className='absolute inset-0 cursor-pointer'
            onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                if (swiper) {
                    swiper.slideTo(index)
                    setSelectedIndex(index)
                }
            }}
        />
    )
}

const ContentThumbnail = ({ content }: { content: Content }) => {
    if (!content.url) return null

    switch (content.type) {
        case 'IMAGE':
            return (
                <div className='relative w-full h-full pointer-events-none'>
                    <S3Image
                        src={content.url}
                        alt='thumbnail'
                        fill
                        sizes='100px'
                        className='object-cover w-full h-full object-center'
                    />
                </div>
            )
        case 'VIDEO':
            return (
                <div className='flex items-center justify-center w-full h-full text-white bg-purple-dark'>
                    <FontAwesomeIcon icon={faVideo} size='lg' />
                </div>
            )
        case 'AUDIO':
            return (
                <div className='flex items-center justify-center w-full h-full text-white bg-purple-dark'>
                    <FontAwesomeIcon icon={faMusic} size='lg' />
                </div>
            )
        default:
            return null
    }
}

const AttachementCaroussel = (props: {
    contents: Content[]
    selectedIndex: number
    setSelectedIndex: (value: number) => void
    setSwiper: (swiper: SwiperClass | undefined) => void
    loop: boolean
}) => {
    return (
        <div className='w-full max-w-[380px] h-[100px] mt-4'>
            <Swiper
                className='w-full h-full pb-4'
                spaceBetween={10}
                slidesPerView={3}
                loop={props.loop}
                onSwiper={swiper => {
                    props.setSwiper(swiper)
                }}
                onActiveIndexChange={swiper => {
                    props.setSelectedIndex(swiper.realIndex)
                }}
            >
                {props.contents.map((content, index) => (
                    <SwiperSlide key={index}>
                        <div className='w-[100%] h-[100%] border-black overflow-hidden bg-black relative border-[1px]'>
                            {content.url && (
                                <ContentThumbnail content={content} />
                            )}
                            <SwiperNavigation
                                index={index}
                                setSelectedIndex={props.setSelectedIndex}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}

const Attachements = (props: { contents: Content[] }) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const [swiper, setSwiper] = useState<SwiperClass | undefined>()

    return (
        <div className='w-full h-full flex flex-col justify-center items-center max-w-[380px]'>
            <FocusedAttachement
                content={props.contents[selectedIndex]}
                onPrevClick={() => {
                    swiper?.slidePrev()
                }}
                onNextClick={() => {
                    swiper?.slideNext()
                }}
            />
            <AttachementCaroussel
                contents={props.contents}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                setSwiper={setSwiper}
                loop={props.contents.length > 3}
            />
        </div>
    )
}

const TablatureName = (props: { value: string }) => {
    return <div className='text-3xl font-bold text-black'>{props.value}</div>
}

const TablaturePrice = (props: { value: number }) => {
    return (
        <div className='text-3xl font-bold text-purple-dark'>
            ${props.value}
        </div>
    )
}

const ArtistName = (props: { value: string }) => {
    return <div className='text-sm text-black'>{props.value}</div>
}

const TablatureDescription = (props: { value: string }) => {
    return <div className='text-lg text-black'>{props.value}</div>
}

const TablatureWarning = () => {
    return (
        <div className='text-sm text-slate-400'>
            This product is a downloadable tablature. All tablature are
            handwritten. You can ask if a Guitar Pro version is available by
            contacting me by email. I usually answer under 48h hours.
        </div>
    )
}

const AddToCartButton = (props: { id: string }) => {
    const { getItems, addItem, removeItem, isInCart } = useCart()
    const purchaseData = usePurchases()
    const [isAnimating, setIsAnimating] = useState(false)

    // Safely destructure with defaults
    const { hasPurchased = () => false, isLoading: purchasesLoading = false } =
        purchaseData || {}

    const isItemInCart = isInCart({ type: productType.TABLATURE, id: props.id })
    const alreadyOwned =
        typeof hasPurchased === 'function' ? hasPurchased(props.id) : false

    const handleClick = () => {
        // Prevent adding to cart if already purchased
        if (alreadyOwned) {
            return
        }

        getItems()
        if (isItemInCart) {
            removeItem({ type: productType.TABLATURE, id: props.id })
        } else {
            addItem({ type: productType.TABLATURE, id: props.id })
        }

        // Trigger animation
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1000)
    }

    // Show loading state while checking purchases
    if (purchasesLoading) {
        return (
            <DefaultButton
                onClick={() => {}}
                color='disabled'
                disabled={true}
                className='px-4 w-full py-2 xs:px-4 xl:py-2 rounded-none font-bold'
            >
                Loading...
            </DefaultButton>
        )
    }

    // Show "View Downloads" if user has purchased this item
    if (alreadyOwned) {
        return (
            <Link href='/user/downloads' className='w-full'>
                <DefaultButton
                    onClick={() => {}}
                    color='green'
                    className='px-4 w-full py-2 xs:px-4 xl:py-2 rounded-none font-bold'
                >
                    <span className='flex items-center justify-center gap-2'>
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                        </svg>
                        View Downloads
                    </span>
                </DefaultButton>
            </Link>
        )
    }

    return (
        <DefaultButton
            onClick={handleClick}
            color={isAnimating ? 'green' : isItemInCart ? 'red' : 'yellow'}
            disabled={isAnimating}
            className={`
                px-4 w-full py-2 xs:px-4 xl:py-2 rounded-none font-bold
                relative overflow-hidden
            `}
        >
            <span
                className={`
                transition-transform duration-200 inline-block
                ${isAnimating ? 'scale-110' : 'scale-100'}
            `}
            >
                {isAnimating
                    ? 'Done !'
                    : isItemInCart
                    ? 'Remove from cart'
                    : 'Add to cart'}
            </span>
        </DefaultButton>
    )
}

const ArtistDescription = (props: { artist: ArtistWithContents }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className='flex flex-col w-full gap-2'>
            <div
                className='flex items-center gap-4 cursor-pointer'
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {props.artist.contents[0].url && (
                    <div className='relative w-16 h-16 overflow-hidden border-2 border-black'>
                        <S3Image
                            src={props.artist.contents[0].url}
                            alt={props.artist.name}
                            fill
                            sizes='64px'
                            className='object-cover object-center w-full h-full'
                        />
                    </div>
                )}
                <div className='flex-1'>
                    <h3 className='text-xl font-bold'>{props.artist.name}</h3>
                </div>
                <div
                    className={`transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                >
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
            </div>
            {props.artist.description && (
                <div
                    className={`
                    overflow-hidden transition-all duration-300
                    ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
                >
                    <p className='pl-20 text-base leading-relaxed'>
                        {props.artist.description}
                    </p>
                </div>
            )}
        </div>
    )
}

const Sheet = (props: { product: TablatureProduct }) => {
    return (
        <div className='flex flex-col items-start justify-start w-full h-full gap-10 break-words'>
            <div className='flex flex-col w-full'>
                <div className='flex flex-wrap items-start justify-between w-full gap-2'>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-start gap-4'>
                            <TablatureName value={props.product.title} />
                            <UpdateButton
                                href={`/dashboard?id=${props.product.id}&type=tablature&mode=update`}
                            />
                        </div>
                    </div>
                    <div className='flex-shrink-0'>
                        <TablaturePrice value={props.product.price} />
                    </div>
                </div>
                <div className='w-full'>
                    <ArtistName value={props.product.artists[0].name} />
                </div>
                {props.product.description && (
                    <div className='w-full pt-10'>
                        <TablatureDescription
                            value={props.product.description}
                        />
                    </div>
                )}
            </div>

            {props.product.artists.length > 0 && (
                <div className='flex flex-col w-full gap-6'>
                    <h2 className='pb-2 text-2xl font-bold border-b-2 border-black'>
                        About the Artist
                        {props.product.artists.length > 1 ? 's' : ''}
                    </h2>
                    <div className='flex flex-col gap-8'>
                        {props.product.artists.map(artist => (
                            <ArtistDescription
                                key={artist.id}
                                artist={artist}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

const ImageContent = ({ url }: { url: string }) => {
    return (
        <S3Image
            src={url}
            alt='image'
            fill
            sizes='(max-width: 380px) 100vw, 380px'
            className='object-cover w-full h-full object-center'
            priority={true}
        />
    )
}

const VideoContent = ({ url }: { url: string }) => {
    // Extract YouTube video ID from URL
    const getYouTubeId = (url: string) => {
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return match && match[2].length === 11 ? match[2] : null
    }

    const videoId = getYouTubeId(url)

    if (!videoId) {
        return (
            <div className='flex items-center justify-center w-full h-full text-white'>
                Invalid YouTube URL
            </div>
        )
    }

    return (
        <div className='flex items-center justify-center w-full h-full'>
            <iframe
                width='100%'
                height='100%'
                src={`https://www.youtube.com/embed/${videoId}`}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
                className='object-contain'
            />
        </div>
    )
}

const AudioContent = ({ url }: { url: string }) => {
    return <S3Audio url={url} />
}

interface ProductClientProps {
    product: TablatureProduct
}

const ProductClient = ({ product }: ProductClientProps) => {
    const { isXL } = useWindowSize()

    const renderContent = () => {
        let contents: Content[] = [
            ...product.artists[0].contents,
            ...product.contents,
        ]

        const attachments = <Attachements contents={contents} />

        const sheet = <Sheet product={product} />

        const buttons = (
            <div className='flex flex-col items-center justify-center w-full gap-4'>
                <AddToCartButton id={product.id} />
            </div>
        )

        return isXL ? (
            <>
                {attachments}
                <div className='flex flex-col items-center justify-center w-full gap-10'>
                    {sheet}
                    {buttons}
                    <TablatureWarning />
                </div>
            </>
        ) : (
            <>
                {sheet}
                {attachments}
                {buttons}
                <TablatureWarning />
            </>
        )
    }

    return (
        <div className='flex flex-col items-center justify-center w-full h-full pb-10 my-10 bg-white'>
            <div className='w-[90%] max-w-[380px] lg:max-w-[1200px] h-full flex flex-col lg:flex-row justify-start items-center lg:justify-start lg:items-start gap-8 xl:gap-20'>
                {renderContent()}
            </div>
        </div>
    )
}

export default ProductClient
