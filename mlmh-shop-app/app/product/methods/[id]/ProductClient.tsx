'use client'
import React, { useState } from 'react'
import { Content, MethodLesson } from '@prisma/client'
import {
    MethodFileManifest,
    MethodOfferWithLesson,
    MethodProduct,
    productType,
} from '@/app/types/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChevronDown,
    faFilePdf,
    faMusic,
    faVideo,
} from '@fortawesome/free-solid-svg-icons'
import { DefaultButton } from '@/app/components/Buttons'
import { useCart } from '@/app/hooks/useCart'
import { usePurchases } from '@/app/hooks/usePurchases'
import UpdateButton from '@/app/components/adminButtons'
import SmartImage from '@/app/components/SmartImage'
import ShareButton from '@/app/components/ShareButton'
import { Attachements } from '@/app/product/tablatures/[id]/ProductClient'
import { filesForOffer } from '@/lib/methods/delivery'
import { formatPrice } from '@/lib/utils'
import { artistPath } from '@/lib/slug'
import Link from 'next/link'

// Human summary of what an offer delivers, derived from the public file
// manifest with the SAME rule as the server-side zip (lib/methods/delivery.ts).
const offerIncludesSummary = (
    offer: MethodOfferWithLesson,
    files: MethodFileManifest[],
): string => {
    const delivered = filesForOffer(offer, files)
    const hasAudio = delivered.some(f => f.role === 'AUDIO')
    const hasVideo = delivered.some(f => f.role === 'VIDEO')
    const hasCover = delivered.some(f => !f.lessonId)

    if (offer.kind === 'LESSON') {
        const parts = ['PDF tab']
        if (hasAudio) parts.push('audio lesson')
        if (hasVideo) parts.push('video lesson')
        return `Includes ${parts.join(' + ')}`
    }

    const lessonCount = new Set(
        delivered.filter(f => f.lessonId).map(f => f.lessonId),
    ).size
    if (lessonCount === 0) return ''

    const media: string[] = []
    if (hasAudio) media.push('audio')
    if (hasVideo) media.push('video')
    const perLesson = media.length > 0 ? ` (PDF + ${media.join(' + ')} each)` : ' (PDF each)'

    return (
        `Includes ${lessonCount} lesson${lessonCount > 1 ? 's' : ''}${perLesson}` +
        (hasCover ? ' + the full booklet cover' : '')
    )
}

const OfferCartButton = (props: { offerId: string; compact?: boolean }) => {
    const { addItem, removeItem, isInCart } = useCart()
    const purchaseData = usePurchases()
    const [isAnimating, setIsAnimating] = useState(false)

    const {
        hasPurchasedOffer = () => false,
        isLoading: purchasesLoading = false,
    } = purchaseData || {}

    const cartItem = { type: productType.METHOD, id: props.offerId }
    const isItemInCart = isInCart(cartItem)
    const alreadyOwned = hasPurchasedOffer(props.offerId)

    const sizeClass = props.compact
        ? 'px-3 py-1.5 text-xs min-w-[110px]'
        : 'px-4 py-2 text-sm min-w-[150px]'
    const buttonClassName = `rounded-none font-bold ${sizeClass}`

    const handleClick = () => {
        if (alreadyOwned) return
        if (isItemInCart) {
            removeItem(cartItem)
        } else {
            addItem(cartItem)
        }
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1000)
    }

    if (purchasesLoading) {
        return (
            <DefaultButton
                onClick={() => {}}
                color='disabled'
                disabled={true}
                className={buttonClassName}
            >
                Loading...
            </DefaultButton>
        )
    }

    if (alreadyOwned) {
        return (
            <Link href='/user/downloads'>
                <DefaultButton
                    onClick={() => {}}
                    color='green'
                    className={buttonClassName}
                >
                    View Downloads
                </DefaultButton>
            </Link>
        )
    }

    return (
        <DefaultButton
            onClick={handleClick}
            color={isAnimating ? 'green' : isItemInCart ? 'red' : 'yellow'}
            disabled={isAnimating}
            className={buttonClassName}
        >
            {isAnimating
                ? 'Done !'
                : isItemInCart
                ? 'Remove from cart'
                : 'Add to cart'}
        </DefaultButton>
    )
}

// FULL: the featured option, given the most visual weight ("best value").
const FeaturedOfferCard = (props: {
    offer: MethodOfferWithLesson
    files: MethodFileManifest[]
}) => {
    const { offer, files } = props
    const includes = offerIncludesSummary(offer, files)

    return (
        <div className='relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pt-7 bg-purple-dark text-white rounded-lg border-2 border-black shadow-base'>
            <span className='absolute -top-3 left-6 bg-yellow-khaki text-black text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border-2 border-black'>
                Best value
            </span>
            <div className='min-w-0'>
                <p className='text-xl font-bold'>{offer.title}</p>
                {includes && (
                    <p className='text-sm text-white/80'>{includes}</p>
                )}
            </div>
            <div className='flex items-center gap-4 flex-shrink-0'>
                <span className='text-3xl font-bold'>
                    {formatPrice(offer.price)}
                </span>
                <OfferCartButton offerId={offer.id} />
            </div>
        </div>
    )
}

// DOCUMENTS: second tier — still its own card, less emphasis than FULL.
const SecondaryOfferCard = (props: {
    offer: MethodOfferWithLesson
    files: MethodFileManifest[]
    fullOwned: boolean
}) => {
    const { offer, files, fullOwned } = props
    const includes = offerIncludesSummary(offer, files)

    return (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-purple-dark/5 rounded-lg border-2 border-black'>
            <div className='min-w-0'>
                <p className='text-lg font-bold'>{offer.title}</p>
                {includes && (
                    <p className='text-sm text-gray-600'>{includes}</p>
                )}
                {fullOwned && (
                    <p className='text-xs text-green-700'>
                        Already included in your Complete package
                    </p>
                )}
            </div>
            <div className='flex items-center gap-4 flex-shrink-0'>
                <span className='text-2xl font-bold text-purple-dark'>
                    {formatPrice(offer.price)}
                </span>
                <OfferCartButton offerId={offer.id} />
            </div>
        </div>
    )
}

// LESSON: third tier — a compact list, the least visually prominent option.
const OfferRow = (props: {
    offer: MethodOfferWithLesson
    files: MethodFileManifest[]
    fullOwned: boolean
}) => {
    const { offer, files, fullOwned } = props
    const includes = offerIncludesSummary(offer, files)

    return (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-white'>
            <div className='min-w-0'>
                <p className='text-sm font-bold'>{offer.title}</p>
                {includes && (
                    <p className='text-xs text-gray-500'>{includes}</p>
                )}
                {fullOwned && (
                    <p className='text-xs text-green-700'>
                        Already included in your Complete package
                    </p>
                )}
            </div>
            <div className='flex items-center gap-3 flex-shrink-0'>
                <span className='text-base font-bold text-purple-dark'>
                    {formatPrice(offer.price)}
                </span>
                <OfferCartButton offerId={offer.id} compact />
            </div>
        </div>
    )
}

const LessonRow = (props: {
    lesson: MethodLesson
    files: MethodFileManifest[]
}) => {
    const lessonFiles = props.files.filter(f => f.lessonId === props.lesson.id)
    const hasDoc = lessonFiles.some(f => f.role === 'DOCUMENT')
    const hasAudio = lessonFiles.some(f => f.role === 'AUDIO')
    const hasVideo = lessonFiles.some(f => f.role === 'VIDEO')

    return (
        <li className='flex items-center justify-between px-4 py-3'>
            <span className='font-medium'>
                {props.lesson.rank}. {props.lesson.title}
            </span>
            <span className='flex items-center gap-3 text-gray-500'>
                {hasDoc && (
                    <FontAwesomeIcon
                        icon={faFilePdf}
                        title='PDF'
                        titleId={`lesson-${props.lesson.id}-pdf-title`}
                    />
                )}
                {hasAudio && (
                    <FontAwesomeIcon
                        icon={faMusic}
                        title='Audio lesson'
                        titleId={`lesson-${props.lesson.id}-audio-title`}
                    />
                )}
                {hasVideo && (
                    <FontAwesomeIcon
                        icon={faVideo}
                        title='Video lesson'
                        titleId={`lesson-${props.lesson.id}-video-title`}
                    />
                )}
            </span>
        </li>
    )
}

const ArtistDescription = (props: {
    artist: MethodProduct['artists'][number]
}) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className='flex flex-col w-full gap-2'>
            <div
                className='flex items-center gap-4 cursor-pointer'
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {props.artist.contents[0]?.url && (
                    <div className='relative w-16 h-16 overflow-hidden border-2 border-black'>
                        <SmartImage
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

interface MethodProductClientProps {
    product: MethodProduct
    // Absolute, canonical URL used by the share actions (built server-side).
    shareUrl: string
}

const MethodProductClient = ({
    product,
    shareUrl,
}: MethodProductClientProps) => {
    const { hasPurchasedOffer } = usePurchases()

    const contents: Content[] = [
        ...product.contents,
        ...(product.artists[0]?.contents ?? []),
    ]

    // Grouped by kind — FULL and DOCUMENTS each get their own featured card,
    // LESSON offers stay a compact list, in lesson rank order.
    const lessonRankById = new Map(
        product.lessons.map(lesson => [lesson.id, lesson.rank]),
    )
    const fullOffer = product.offers.find(offer => offer.kind === 'FULL')
    const documentsOffer = product.offers.find(
        offer => offer.kind === 'DOCUMENTS',
    )
    const lessonOffers = product.offers
        .filter(offer => offer.kind === 'LESSON')
        .sort(
            (a, b) =>
                (lessonRankById.get(a.lessonId ?? '') ?? 0) -
                (lessonRankById.get(b.lessonId ?? '') ?? 0),
        )

    const fullOwned = fullOffer ? hasPurchasedOffer(fullOffer.id) : false

    const primaryArtist = product.artists[0]

    return (
        <div className='flex flex-col items-center justify-center w-full h-full pb-10 my-10 bg-white'>
            <div className='w-[90%] max-w-[380px] lg:max-w-[1200px] h-full flex flex-col lg:flex-row justify-start items-center lg:justify-start lg:items-start gap-8 xl:gap-20'>
                {contents.length > 0 && (
                    <Attachements contents={contents} label='Method' />
                )}
                <div className='flex flex-col items-start justify-start w-full gap-10 break-words'>
                    {/* Header: title, admin shortcut, artist links, share */}
                    <div className='flex flex-col w-full gap-2'>
                        <div className='flex items-center justify-start gap-4'>
                            <div className='text-3xl font-bold text-black'>
                                {product.title}
                            </div>
                            <UpdateButton
                                href={`/admin/methods/${product.id}`}
                            />
                        </div>
                        <div className='flex w-full items-center justify-between gap-4'>
                            {primaryArtist ? (
                                <Link
                                    href={artistPath(primaryArtist)}
                                    className='inline-block text-sm transition-colors hover:text-purple-dark hover:underline'
                                >
                                    {primaryArtist.name}
                                </Link>
                            ) : (
                                <span className='text-sm'>
                                    by Michel Lelong
                                </span>
                            )}
                            <ShareButton
                                url={shareUrl}
                                title={product.title}
                                message={`🎸 Check out "${product.title}" - a guitar method on Michel Lelong Guitar Tab Workshop`}
                                className='flex-shrink-0'
                            />
                        </div>
                        {product.description && (
                            <div className='w-full pt-6 text-lg text-black'>
                                {product.description}
                            </div>
                        )}
                    </div>

                    {/* Contents manifest: the pieces taught in this method */}
                    {product.lessons.length > 0 && (
                        <section className='w-full'>
                            <h2 className='pb-2 text-2xl font-bold border-b-2 border-black'>
                                What&apos;s inside
                            </h2>
                            <ul className='divide-y divide-gray-100 border-2 border-t-0 border-black'>
                                {product.lessons.map(lesson => (
                                    <LessonRow
                                        key={lesson.id}
                                        lesson={lesson}
                                        files={product.files}
                                    />
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Offer picker: FULL and DOCUMENTS stand out as their own
                    cards (FULL first, most emphasis), single lessons stay a
                    compact list below — visually FULL > DOCUMENTS > LESSONS. */}
                    {product.offers.length > 0 && (
                        <section className='w-full flex flex-col gap-5'>
                            <h2 className='pb-2 text-2xl font-bold border-b-2 border-black'>
                                Choose your option
                            </h2>

                            {fullOffer && (
                                <FeaturedOfferCard
                                    offer={fullOffer}
                                    files={product.files}
                                />
                            )}

                            {documentsOffer && (
                                <SecondaryOfferCard
                                    offer={documentsOffer}
                                    files={product.files}
                                    fullOwned={fullOwned}
                                />
                            )}

                            {lessonOffers.length > 0 && (
                                <div className='flex flex-col gap-2'>
                                    <h3 className='text-xs font-bold uppercase tracking-wide text-gray-500'>
                                        Or buy a single lesson
                                    </h3>
                                    <div className='divide-y divide-gray-200 border-2 border-black rounded-lg overflow-hidden'>
                                        {lessonOffers.map(offer => (
                                            <OfferRow
                                                key={offer.id}
                                                offer={offer}
                                                files={product.files}
                                                fullOwned={fullOwned}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    <div className='text-sm text-slate-400'>
                        This product is a downloadable guitar method. Files
                        (PDF, audio or video lessons) are delivered as a zip
                        right after purchase, and stay available anytime from
                        your account.
                    </div>

                    {product.artists.length > 0 && (
                        <div className='flex flex-col w-full gap-6'>
                            <h2 className='pb-2 text-2xl font-bold border-b-2 border-black'>
                                About the Artist
                                {product.artists.length > 1 ? 's' : ''}
                            </h2>
                            <div className='flex flex-col gap-8'>
                                {product.artists.map(artist => (
                                    <ArtistDescription
                                        key={artist.id}
                                        artist={artist}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MethodProductClient
