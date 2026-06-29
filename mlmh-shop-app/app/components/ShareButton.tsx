'use client'

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faShareNodes,
    faLink,
    faCheck,
    faXmark,
    faEllipsis,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
    /** Absolute URL to share (provided by the caller — do not assume window). */
    url: string
    /** Short heading/context shown in the modal (e.g. the tablature title). */
    title: string
    /** Friendly share message used as the text in WhatsApp / X / native share.
     *  Defaults to `title` when omitted. */
    message?: string
    /** Optional classes for the trigger button. */
    className?: string
}

// navigator.share exists only client-side (mostly mobile). useSyncExternalStore reads
// it without an effect: false on the server (matching the first client render → no
// hydration mismatch), real value once hydrated.
const subscribeNoop = () => () => {}
const hasNativeShare = () =>
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const triggerClasses = cn(
    'inline-flex items-center justify-center gap-2 px-4 py-2 cursor-pointer font-bold',
    'border-2 border-black rounded-none bg-purple-light text-black',
    'shadow-small lg:shadow-base [--shadow-color:theme(colors.purple-dark)]',
    'transition-all hover:bg-purple-light/70',
    'hover:shadow-none hover:translate-x-boxSmallShadowX hover:translate-y-boxSmallShadowY',
    'hover:lg:translate-x-boxShadowX hover:lg:translate-y-boxShadowY',
    'active:shadow-none active:translate-x-boxSmallShadowX active:translate-y-boxSmallShadowY',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-dark focus-visible:ring-offset-2',
)

const optionClasses = cn(
    'flex items-center gap-3 w-full px-4 py-3 cursor-pointer text-left font-medium',
    'border-2 border-black rounded-none bg-white text-black transition-colors',
    'hover:bg-purple-light',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-dark',
)

export default function ShareButton({
    url,
    title,
    message,
    className,
}: ShareButtonProps) {
    const canNativeShare = useSyncExternalStore(
        subscribeNoop,
        hasNativeShare,
        () => false,
    )
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (copyTimeout.current) clearTimeout(copyTimeout.current)
        }
    }, [])

    // Close on Escape while the modal is open.
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    const shareText = message ?? title

    const handleNativeShare = async () => {
        try {
            await navigator.share({ title, text: shareText, url })
            setOpen(false)
        } catch (error) {
            // The user dismissing the native sheet rejects with AbortError — ignore.
            if (error instanceof Error && error.name === 'AbortError') return
            console.error('Native share failed:', error)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            if (copyTimeout.current) clearTimeout(copyTimeout.current)
            copyTimeout.current = setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Copy link failed:', error)
        }
    }

    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
        `${shareText} ${url}`,
    )}`
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText,
    )}&url=${encodeURIComponent(url)}`

    return (
        <>
            <button
                type='button'
                onClick={() => setOpen(true)}
                className={cn(triggerClasses, className)}
                aria-haspopup='dialog'
                aria-label='Share'
            >
                <FontAwesomeIcon icon={faShareNodes} />
                Share
            </button>

            {/* `open` only flips true on a client click, so document.body exists. */}
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className='fixed inset-0 z-[100] flex items-center justify-center p-4'
                        role='dialog'
                        aria-modal='true'
                        aria-label='Share this page'
                    >
                        <div
                            className='absolute inset-0 bg-black/50'
                            onClick={() => setOpen(false)}
                        />
                        <div className='relative w-full max-w-sm flex flex-col gap-5 border-2 border-black bg-white-oldlace p-6 shadow-base [--shadow-color:theme(colors.purple-dark)]'>
                            <div className='flex items-start justify-between gap-4'>
                                <div className='flex flex-col gap-1'>
                                    <h2 className='text-xl font-bold text-black'>
                                        Share
                                    </h2>
                                    <p className='text-sm text-gray-600 line-clamp-2'>
                                        {title}
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => setOpen(false)}
                                    aria-label='Close'
                                    className='flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-purple-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-dark'
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <div className='flex flex-col gap-3'>
                                <a
                                    href={whatsappHref}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className={optionClasses}
                                    onClick={() => setOpen(false)}
                                >
                                    <FontAwesomeIcon
                                        icon={faWhatsapp}
                                        className='w-5 text-[#25D366]'
                                    />
                                    WhatsApp
                                </a>

                                <a
                                    href={twitterHref}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className={optionClasses}
                                    onClick={() => setOpen(false)}
                                >
                                    <FontAwesomeIcon
                                        icon={faXTwitter}
                                        className='w-5'
                                    />
                                    X (Twitter)
                                </a>

                                <button
                                    type='button'
                                    onClick={handleCopy}
                                    className={cn(
                                        optionClasses,
                                        copied && 'bg-green hover:bg-green',
                                    )}
                                    aria-label={
                                        copied ? 'Link copied' : 'Copy link'
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={copied ? faCheck : faLink}
                                        className='w-5 text-purple-dark'
                                    />
                                    {copied ? 'Link copied!' : 'Copy link'}
                                </button>

                                {canNativeShare && (
                                    <button
                                        type='button'
                                        onClick={handleNativeShare}
                                        className={optionClasses}
                                    >
                                        <FontAwesomeIcon
                                            icon={faEllipsis}
                                            className='w-5 text-purple-dark'
                                        />
                                        More options…
                                    </button>
                                )}
                            </div>

                            {/* Polite live region so screen-reader users hear the copy confirmation. */}
                            <span aria-live='polite' className='sr-only'>
                                {copied ? 'Link copied to clipboard' : ''}
                            </span>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    )
}
