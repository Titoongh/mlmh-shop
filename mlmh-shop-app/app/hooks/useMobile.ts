'use client'
import { useState, useEffect } from 'react'

const useMobile = () => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            // Check if screen width is mobile-sized (typically < 768px)
            const isMobileWidth = window.innerWidth < 768

            // Check user agent for mobile devices
            const isMobileUserAgent =
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent,
                )

            // Consider it mobile if either condition is true
            setIsMobile(isMobileWidth || isMobileUserAgent)
        }

        // Check on mount
        checkMobile()

        // Listen for window resize
        window.addEventListener('resize', checkMobile)

        return () => {
            window.removeEventListener('resize', checkMobile)
        }
    }, [])

    return isMobile
}

export default useMobile
