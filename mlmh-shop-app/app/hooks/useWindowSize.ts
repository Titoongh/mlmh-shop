import { useState, useEffect } from 'react'

interface WindowSize {
    width: number | undefined
    height: number | undefined
    isXL: boolean
}

export const useWindowSize = (): WindowSize => {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: undefined,
        height: undefined,
        isXL: false,
    })

    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
                isXL: window.innerWidth >= 800, // Tailwind's XL breakpoint
            })
        }

        // Add event listener
        window.addEventListener('resize', handleResize)

        // Call handler right away so state gets updated with initial window size
        handleResize()

        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return windowSize
}
