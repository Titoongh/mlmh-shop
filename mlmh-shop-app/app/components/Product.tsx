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

const MainAttachement = (props: {
    content: Content
    swiper: SwiperClass | undefined
}) => {
    return (
        <div className='w-[90vw] h-[90vw] border-2 border-black flex flex-col justify-start items-center border-collapse'>
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
                {props.swiper && (
                    <>
                        <div
                            className='absolute left-2 text-white'
                            onClick={() => {
                                console.log('on click prev')
                                props.swiper?.slidePrev()
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faArrowAltCircleLeft}
                                className='text-white'
                                size='2xl'
                            />
                        </div>
                        <div
                            className='absolute right-2 text-white'
                            onClick={() => {
                                console.log('on click prev')
                                props.swiper?.slideNext()
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faArrowAltCircleRight}
                                className='text-white'
                                size='2xl'
                            />
                        </div>
                    </>
                )}
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
                console.log('Swiper instance:', swiper) // Debug log
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
        <div className='w-[90vw] h-[100px] m-2'>
            <Swiper
                className='w-full h-full pb-4 border-2'
                spaceBetween={10}
                slidesPerView={3}
                onSwiper={swiper => {
                    console.log('set swiper')
                    props.setSwiper(swiper)
                }}
                onActiveIndexChange={swiper => {
                    props.setSelectedIndex(swiper.activeIndex)
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

    console.log('swiper', swiper)
    return (
        <div className='w-full h-full flex flex-col justify-center items-center'>
            <MainAttachement
                content={props.contents[selectedIndex]}
                swiper={swiper}
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

const Product = () => {
    const [product, setProduct] = useState<TablatureProduct | undefined>()
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        fetch('api/tablatures/e482f226-c0c8-4d98-88fa-3990bc229e71').then(
            res => {
                console.log('res status', res.status)
                if (res.status == 200) {
                    res.json().then(result => {
                        console.log('result', result)
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
        <div className='bg-white flex flex-row justify-center items-center h-full w-full'>
            {product && (
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
            )}
        </div>
    )
}

export default Product
