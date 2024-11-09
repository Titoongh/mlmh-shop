'use client'
import React, { useEffect, useState } from 'react'
import { Artist, Content, Tablature } from '@prisma/client'
import { prisma } from '../prisma'
import Image from 'next/image'
import {
    Cart,
    LocalStorageEnum,
    productType,
    TablatureProduct,
} from '../types/types'
import { Swiper, SwiperClass, SwiperSlide, useSwiper } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/scrollbar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowAltCircleLeft,
    faArrowAltCircleRight,
    faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import { CTA, DefaultButton } from './Buttons'
import { useWindowSize } from '../hooks/useWindowSize'
import useLocalStorage from '../hooks/useLocalStorage'
import { useCart } from '../hooks/useCart'

const FocusedAttachement = (props: {
    content: Content
    onPrevClick: () => void
    onNextClick: () => void
}) => {
    return (
        <div className='w-full max-w-[380px] h-[380px] border-2 border-black flex flex-col justify-start items-center border-collapse shadow-base'>
            <div className='w-full bg-white-oldlace h-20 flex justify-start items-center pl-6 text-xl border-b-2 border-black'>
                Tablature
            </div>
            <div className='w-full h-full bg-black flex justify-center items-center relative'>
                {props.content.url && (
                    <Image
                        src={props.content.url}
                        alt='image'
                        fill
                        className='object-contain'
                    />
                )}
                <div
                    className='absolute left-2 text-white cursor-pointer'
                    onClick={props.onPrevClick}
                >
                    <FontAwesomeIcon
                        icon={faArrowAltCircleLeft}
                        className='text-white'
                        size='2xl'
                    />
                </div>
                <div
                    className='absolute right-2 text-white cursor-pointer'
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
            onClick={() => {
                if (swiper) {
                    swiper.slideTo(index)
                    setSelectedIndex(index)
                }
            }}
        />
    )
}

const AttachementCaroussel = (props: {
    contents: Content[]
    selectedIndex: number
    setSelectedIndex: (value: number) => void
    setSwiper: (swiper: SwiperClass | undefined) => void
}) => {
    return (
        <div className='w-full max-w-[380px] h-[100px] mt-4'>
            <Swiper
                className='w-full h-full pb-4'
                spaceBetween={10}
                slidesPerView={3}
                loop
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
                                <Image
                                    src={content.url}
                                    alt='image'
                                    fill
                                    className='object-contain'
                                />
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
                onPrevClick={() => swiper?.slidePrev()}
                onNextClick={() => swiper?.slideNext()}
            />
            <AttachementCaroussel
                contents={props.contents}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                setSwiper={setSwiper}
            />
        </div>
    )
}

const TablatureName = (props: { value: string }) => {
    return <div className='text-black text-3xl font-bold'>{props.value}</div>
}

const TablaturePrice = (props: { value: number }) => {
    return (
        <div className='text-purple-dark text-3xl font-bold'>
            ${props.value}
        </div>
    )
}

const ArtistName = (props: { value: string }) => {
    return <div className='text-black text-sm'>{props.value}</div>
}

const TablatureDescription = (props: { value: string }) => {
    return <div className='text-black text-lg'>{props.value}</div>
}

const TablatureWarning = () => {
    return (
        <div className='text-slate-400 text-sm'>
            This product is a downloadable tablature. All tablature are
            handwritten. You can ask if a Guitar Pro version is available by
            contacting me by email. I usually answer under 48h hours.
        </div>
    )
}

const AddToCartButton = (props: { id: string }) => {
    const { addItem, removeItem, isInCart } = useCart()
    const [isAnimating, setIsAnimating] = useState(false)
    const isItemInCart = isInCart({ type: productType.TABLATURE, id: props.id })

    const handleClick = () => {
        if (isItemInCart) {
            removeItem({ type: productType.TABLATURE, id: props.id })
        } else {
            addItem({ type: productType.TABLATURE, id: props.id })
        }

        // Trigger animation
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1000)
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

const BuyNowButton = (props: { id: string }) => {
    return (
        <DefaultButton
            onClick={() => {
                console.log(`Go to payment page: ${props.id}`)
            }}
            color='purple'
            className={`
                px-4 w-full py-2 xs:px-4 xl:py-2 rounded-none font-bold
            `}
        >
            Buy Now
        </DefaultButton>
    )
}

const ArtistDescription = (props: { artist: Artist }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className='w-full flex flex-col gap-2'>
            <div
                className='flex items-center gap-4 cursor-pointer'
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className='relative w-16 h-16 overflow-hidden border-2 border-black'>
                    <Image
                        src={props.artist.picture}
                        alt={props.artist.name}
                        fill
                        className='object-cover'
                    />
                </div>
                <div className='flex-1'>
                    <h3 className='text-xl font-bold'>{props.artist.name}</h3>
                    {props.artist.genre && (
                        <p className='text-sm text-gray-600'>
                            {props.artist.genre}
                        </p>
                    )}
                </div>
                <div
                    className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                    <p className='text-base leading-relaxed pl-20'>
                        {props.artist.description}
                    </p>
                </div>
            )}
        </div>
    )
}

// const ArtistDescription = (props: { artist: Artist }) => {
//     return (
//         <div className='w-full flex flex-col gap-2'>
//             <div className='flex items-center gap-4'>
//                 <div className='relative w-16 h-16 overflow-hidden border-2 border-black'>
//                     <Image
//                         src={props.artist.picture}
//                         alt={props.artist.name}
//                         fill
//                         className='object-cover'
//                     />
//                 </div>
//                 <div>
//                     <h3 className='text-xl font-bold'>{props.artist.name}</h3>
//                     {props.artist.genre && (
//                         <p className='text-sm text-gray-600'>
//                             {props.artist.genre}
//                         </p>
//                     )}
//                 </div>
//             </div>
//             {props.artist.description && (
//                 <p className='text-base leading-relaxed pl-20'>
//                     {props.artist.description}
//                 </p>
//             )}
//         </div>
//     )
// }

const Sheet = (props: { product: TablatureProduct }) => {
    return (
        <div className='w-full h-full flex flex-col justify-start items-start break-words gap-10'>
            <div className='w-full flex flex-col'>
                <div className='w-full flex flex-wrap gap-2 justify-between items-start'>
                    <div className='flex-1 min-w-0'>
                        <TablatureName value={props.product.title} />
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
                <div className='w-full flex flex-col gap-6'>
                    <h2 className='text-2xl font-bold border-b-2 border-black pb-2'>
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

const Product = (props: { id: string }) => {
    const [product, setProduct] = useState<TablatureProduct | undefined>()
    const [loading, setLoading] = useState<boolean>(true)

    const { isXL } = useWindowSize()

    useEffect(() => {
        fetch(`/api/tablatures/${props.id}`).then(res => {
            if (res.status == 200) {
                res.json().then(result => {
                    setProduct(result)
                    setLoading(false)
                })
            } else {
                throw new Error('Product Not Found')
            }
        })
    }, [])

    const renderContent = () => {
        if (!product) return null

        const attachments = (
            <Attachements
                contents={[
                    {
                        url: product.artists[0].picture,
                    } as Content,
                    ...product.contents,
                    {
                        url: product.artists[0].picture,
                    } as Content,
                    ...product.contents,
                    {
                        url: product.artists[0].picture,
                    } as Content,
                    ...product.contents,
                    {
                        url: product.artists[0].picture,
                    } as Content,
                    {
                        url: product.artists[0].picture,
                    } as Content,
                    {
                        url: product.artists[0].picture,
                    } as Content,
                    ...product.contents,
                ]}
            />
        )

        const sheet = <Sheet product={product} />

        const buttons = (
            <div className='w-full flex flex-col justify-center items-center gap-4'>
                <AddToCartButton id={product.id} />
                <BuyNowButton id={product.id} />
            </div>
        )

        return isXL ? (
            <>
                {attachments}
                <div className='flex flex-col w-full gap-10 justify-center items-center'>
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
        <div className='bg-white flex flex-col justify-center items-center h-full w-full my-10 pb-10'>
            {product && (
                <div className='w-[90%] max-w-[380px] lg:max-w-[1200px] h-full flex flex-col lg:flex-row justify-start items-center lg:justify-start lg:items-start gap-8 xl:gap-20'>
                    {renderContent()}
                </div>
            )}
        </div>
    )
}

export default Product
