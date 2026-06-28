'use client'

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faShareNodes,
    faLink,
    faCheck,
    faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
    /** Absolute URL to share (provided by the caller — do not assume window). */
    url: string
    /** Title/text to share. */
    title: string
    /** Optional wrapper classes. */
    className?: string
}

// Shared visual language for every action: square, black-bordered, shadow-base box
// with the app's "press" animation (shadow collapses + element shifts).
const itemBase = cn(
    'inline-flex items-center justify-center w-10 h-10 cursor-pointer',
    'border-2 border-black rounded-none bg-white-oldlace text-black',
    'shadow-small lg:shadow-base [--shadow-color:theme(colors.purple-dark)]',
    'transition-all',
    'hover:bg-purple-light',
    'hover:shadow-none hover:translate-x-boxSmallShadowX hover:translate-y-boxSmallShadowY',
    'hover:lg:translate-x-boxShadowX hover:lg:translate-y-boxShadowY',
    'active:shadow-none active:translate-x-boxSmallShadowX active:translate-y-boxSmallShadowY',
    'active:lg:translate-x-boxShadowX active:lg:translate-y-boxShadowY',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-dark focus-visible:ring-offset-2',
)

// navigator.share exists only client-side (mostly mobile). useSyncExternalStore reads
// it without an effect: false on the server (matching first client render → no
// hydration mismatch), real value once hydrated.
const subscribeNoop = () => () => {}
const hasNativeShare = () =>
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export default function ShareButton({ url, title, className }: ShareButtonProps) {
    const canNativeShare = useSyncExternalStore(
        subscribeNoop,
        hasNativeShare,
        () => false,
    )
    const [copied, setCopied] = useState(false)
    const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clean up the "Copied!" timeout on unmount.
    useEffect(() => {
        return () => {
            if (copyTimeout.current) clearTimeout(copyTimeout.current)
        }
    }, [])

    const handleNativeShare = async () => {
        try {
            await navigator.share({ title, text: title, url })
        } catch (error) {
            // The user dismissing the native sheet rejects with AbortError — ignore it.
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

    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
    const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${url}`)}`
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className='flex items-center gap-2 text-purple-dark'>
                <FontAwesomeIcon icon={faShareNodes} />
                <span className='text-sm font-bold uppercase tracking-wide'>
                    Share
                </span>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
                {canNativeShare && (
                    <button
                        type='button'
                        onClick={handleNativeShare}
                        className={itemBase}
                        aria-label='Share via your device'
                        title='Share'
                    >
                        <FontAwesomeIcon icon={faShareNodes} />
                    </button>
                )}

                <button
                    type='button'
                    onClick={handleCopy}
                    className={cn(itemBase, copied && 'bg-green text-black')}
                    aria-label={copied ? 'Link copied' : 'Copy link'}
                    title={copied ? 'Copied!' : 'Copy link'}
                >
                    <FontAwesomeIcon icon={copied ? faCheck : faLink} />
                </button>

                <a
                    href={whatsappHref}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={itemBase}
                    aria-label='Share on WhatsApp'
                    title='WhatsApp'
                >
                    <FontAwesomeIcon icon={faWhatsapp} />
                </a>

                <a
                    href={emailHref}
                    className={itemBase}
                    aria-label='Share by email'
                    title='Email'
                >
                    <FontAwesomeIcon icon={faEnvelope} />
                </a>

                <a
                    href={twitterHref}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={itemBase}
                    aria-label='Share on X'
                    title='X (Twitter)'
                >
                    <FontAwesomeIcon icon={faXTwitter} />
                </a>
            </div>

            {/* Polite live region so screen-reader users hear the copy confirmation. */}
            <span aria-live='polite' className='sr-only'>
                {copied ? 'Link copied to clipboard' : ''}
            </span>
        </div>
    )
}
