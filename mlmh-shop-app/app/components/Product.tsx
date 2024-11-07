'use client'
import React, { useEffect, useState } from 'react'
import { Artist, Content, Tablature } from '@prisma/client'
import { prisma } from '../prisma'
import Image from 'next/image'
import { TablatureProduct } from '../types/types'
import { Swiper, SwiperClass, SwiperSlide, useSwiper } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/scrollbar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowAltCircleLeft,
    faArrowAltCircleRight,
} from '@fortawesome/free-solid-svg-icons'
import { CTA, DefaultButton } from './Buttons'

const FocusedAttachement = (props: {
    content: Content
    onPrevClick: () => void
    onNextClick: () => void
}) => {
    return (
        <div className='w-full h-[380px] border-2 border-black flex flex-col justify-start items-center border-collapse shadow-base'>
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

// const FocusedAttachement = (props: {
//     content: Content
//     swiper: SwiperClass | undefined
// }) => {
//     return (
//         <div className='w-full h-[380px] border-2 border-black flex flex-col justify-start items-center border-collapse shadow-base'>
//             <div className='w-full bg-white-oldlace h-20 flex justify-start items-center pl-6 text-xl border-b-2 border-black'>
//                 Tablature
//             </div>
//             <div className='w-full h-full bg-black flex justify-center items-center relative'>
//                 {props.content.url && (
//                     <Image
//                         src={props.content.url}
//                         alt='image'
//                         fill
//                         className='object-contain'
//                     />
//                 )}
//                 {props.swiper && (
//                     <>
//                         <div
//                             className='absolute left-2 text-white'
//                             onClick={() => {
//                                 props.swiper?.slidePrev()
//                             }}
//                         >
//                             <FontAwesomeIcon
//                                 icon={faArrowAltCircleLeft}
//                                 className='text-white'
//                                 size='2xl'
//                             />
//                         </div>
//                         <div
//                             className='absolute right-2 text-white'
//                             onClick={() => {
//                                 props.swiper?.slideNext()
//                             }}
//                         >
//                             <FontAwesomeIcon
//                                 icon={faArrowAltCircleRight}
//                                 className='text-white'
//                                 size='2xl'
//                             />
//                         </div>
//                     </>
//                 )}
//             </div>
//         </div>
//     )
// }

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
        <div className='w-full h-[100px] my-4'>
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
        <div className='w-full h-full flex flex-col justify-center items-center'>
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
// const Attachements = (props: { contents: Content[] }) => {
//     const [selectedIndex, setSelectedIndex] = useState<number>(0)
//     const [swiper, setSwiper] = useState<SwiperClass | undefined>()

//     return (
//         <div className='w-full h-full flex flex-col justify-center items-center'>
//             <FocusedAttachement
//                 content={props.contents[selectedIndex]}
//                 swiper={swiper}
//             />
//             <AttachementCaroussel
//                 contents={props.contents}
//                 selectedIndex={selectedIndex}
//                 setSelectedIndex={setSelectedIndex}
//                 setSwiper={setSwiper}
//             />
//         </div>
//     )
// }

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

const AddToCartButton = (props: { id: string }) => {
    return (
        <DefaultButton
            onClick={() => {
                console.log(`add to local storage cart: ${props.id}`)
            }}
            shadowColor='yellow-khaki'
            textColor='black'
            backgroundColor='white-oldlace'
            className={`
                px-4 w-full py-2 xs:px-4 xl:py-2 rounded-none font-bold
            `}
        >
            Add to cart
        </DefaultButton>
    )
}

const BuyNowButton = (props: { id: string }) => {
    return (
        <DefaultButton
            onClick={() => {
                console.log(`Go to payment page: ${props.id}`)
            }}
            shadowColor='purple-dark'
            textColor='black'
            backgroundColor='purple-light'
            className={`
                px-4 w-full py-2 xs:px-4 xl:py-2 rounded-none font-bold
            `}
        >
            Buy Now
        </DefaultButton>
    )
}

const Sheet = (props: { product: TablatureProduct }) => {
    return (
        <div className='w-full h-full flex flex-col justify-start items-start'>
            <div className='w-full flex justify-between items-center'>
                <TablatureName value={props.product.title} />
                <TablaturePrice value={props.product.price} />
            </div>
            <ArtistName value={props.product.artists[0].name} />
            {/* <div className='w-full flex justify-between items-center gap-4 my-10'>
                <AddToCartButton id={props.product.id} />
                <BuyNowButton id={props.product.id} />
            </div> */}
        </div>
    )
}

const Product = () => {
    const [product, setProduct] = useState<TablatureProduct | undefined>()
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        fetch('api/tablatures/e482f226-c0c8-4d98-88fa-3990bc229e71').then(
            res => {
                if (res.status == 200) {
                    res.json().then(result => {
                        setProduct(result)
                        setLoading(false)
                    })
                } else {
                    throw new Error('Product Not Found')
                }
            },
        )
    }, [])
    return (
        <div className='bg-white flex flex-col justify-center items-center h-full w-full my-10'>
            {product && (
                <div className='w-[90%] h-full flex flex-col justify-center items-center gap-8'>
                    <Sheet product={product} />
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
                    <div className='w-full flex flex-col justify-between items-center gap-4 my-10'>
                        <AddToCartButton id={product.id} />
                        <BuyNowButton id={product.id} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Product
