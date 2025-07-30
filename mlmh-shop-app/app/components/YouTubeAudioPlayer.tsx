'use client'
import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faStop } from '@fortawesome/free-solid-svg-icons'
import useMobile from '../hooks/useMobile'

interface YouTubeAudioPlayerProps {
    youtubeUrl: string
    className?: string
}

// Global registry to manage all YouTube players and ensure only one plays at a time
const globalPlayerRegistry = new Set<any>()

const stopAllOtherPlayers = (currentPlayer: any) => {
    globalPlayerRegistry.forEach(player => {
        if (
            player !== currentPlayer &&
            player.getPlayerState &&
            player.getPlayerState() === 1
        ) {
            try {
                player.pauseVideo()
            } catch (e) {
                // Player might be destroyed
            }
        }
    })
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
}

export default function YouTubeAudioPlayer({
    youtubeUrl,
    className = '',
}: YouTubeAudioPlayerProps) {
    const isMobile = useMobile()
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [hasBeenInitialized, setHasBeenInitialized] = useState(false)
    const playerRef = useRef<any>(null)
    const videoId = getYouTubeId(youtubeUrl)

    useEffect(() => {
        // Load YouTube IFrame API
        if (!window.YT) {
            const script = document.createElement('script')
            script.src = 'https://www.youtube.com/iframe_api'
            script.async = true
            document.body.appendChild(script)

            // Create global callback for when API is ready
            window.onYouTubeIframeAPIReady = () => {
                // API is loaded, players can now be created
            }
        }
    }, [])

    const initializePlayer = () => {
        if (!window.YT || !window.YT.Player || !videoId) return

        setIsLoading(true)
        setHasError(false)

        // Create a hidden div for the player
        const playerDiv = document.createElement('div')
        playerDiv.style.display = 'none'
        document.body.appendChild(playerDiv)

        playerRef.current = new window.YT.Player(playerDiv, {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
            },
            events: {
                onReady: () => {
                    setIsLoading(false)
                    setHasBeenInitialized(true)
                    // Register this player globally
                    globalPlayerRegistry.add(playerRef.current)
                    // Stop all other players before starting this one
                    stopAllOtherPlayers(playerRef.current)
                    playerRef.current.playVideo()
                    setIsPlaying(true)
                },
                onStateChange: (event: any) => {
                    if (
                        event.data === window.YT.PlayerState.ENDED ||
                        event.data === window.YT.PlayerState.PAUSED
                    ) {
                        setIsPlaying(false)
                    } else if (event.data === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true)
                        // Stop all other players when this one starts playing
                        stopAllOtherPlayers(playerRef.current)
                    }
                },
                onError: () => {
                    setHasError(true)
                    setIsLoading(false)
                    setIsPlaying(false)
                },
            },
        })
    }

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent link navigation when clicking the button
        e.preventDefault()

        if (!videoId) {
            setHasError(true)
            return
        }

        if (!playerRef.current) {
            if (window.YT && window.YT.Player) {
                initializePlayer()
            } else {
                // Wait for API to load
                const checkAPI = setInterval(() => {
                    if (window.YT && window.YT.Player) {
                        clearInterval(checkAPI)
                        initializePlayer()
                    }
                }, 100)

                // Clear interval after 10 seconds to prevent infinite checking
                setTimeout(() => clearInterval(checkAPI), 10000)
            }
            return
        }

        if (isPlaying) {
            playerRef.current.pauseVideo()
            setIsPlaying(false)
        } else {
            // Stop all other players before starting this one
            stopAllOtherPlayers(playerRef.current)
            playerRef.current.playVideo()
            setIsPlaying(true)
        }
    }

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent link navigation when clicking the button
        e.preventDefault()

        if (playerRef.current) {
            try {
                // Remove from global registry
                globalPlayerRegistry.delete(playerRef.current)
                playerRef.current.destroy()
            } catch (e) {
                // Player might already be destroyed
            }
            playerRef.current = null
        }

        // Reset all states to initial state
        setIsPlaying(false)
        setIsLoading(false)
        setHasError(false)
        setHasBeenInitialized(false)
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                try {
                    // Remove from global registry
                    globalPlayerRegistry.delete(playerRef.current)
                    playerRef.current.destroy()
                } catch (e) {
                    // Player might already be destroyed
                }
            }
        }
    }, [])

    // Return null on mobile devices to disable the player
    if (isMobile) {
        return null
    }

    if (!videoId || hasError) {
        return null // Don't render anything if there's no valid video ID or error
    }

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className='flex items-center justify-center w-8 h-8 rounded-full bg-purple-light hover:bg-purple-light transition-colors text-white text-sm disabled:opacity-50 shadow-small border-2 border-black'
                title={
                    isLoading
                        ? 'Loading...'
                        : isPlaying
                        ? 'Pause audio'
                        : 'Play audio'
                }
                aria-label={
                    isLoading
                        ? 'Loading...'
                        : isPlaying
                        ? 'Pause audio'
                        : 'Play audio'
                }
            >
                {isLoading ? (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                    <FontAwesomeIcon
                        icon={isPlaying ? faPause : faPlay}
                        className='text-black'
                        style={{
                            fontSize: '12px',
                            width: '12px',
                            height: '12px',
                            marginLeft: isPlaying ? '0' : '1px',
                        }}
                    />
                )}
            </button>
            {hasBeenInitialized && (
                <button
                    onClick={handleStop}
                    className='flex items-center justify-center w-8 h-8 rounded-full bg-purple-light hover:bg-black transition-colors text-white text-sm shadow-small border-2 border-black'
                    title='Stop audio'
                    aria-label='Stop audio'
                >
                    <FontAwesomeIcon
                        icon={faStop}
                        className='text-white'
                        style={{
                            fontSize: '12px',
                            width: '12px',
                            height: '12px',
                        }}
                    />
                </button>
            )}
        </div>
    )
}

// Extend the global Window interface to include YouTube API types
declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
    }
}
