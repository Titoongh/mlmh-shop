interface ImageSkeletonProps {
    className?: string
    showPulse?: boolean
}

export const ImageSkeleton = ({
    className,
    showPulse = true,
}: ImageSkeletonProps) => {
    return (
        <div
            className={`flex items-center justify-center bg-gray-100 ${
                showPulse ? 'animate-pulse' : ''
            } ${className || ''}`}
        >
            <svg
                className='w-8 h-8 text-gray-300'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
            >
                <path
                    fillRule='evenodd'
                    d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
                    clipRule='evenodd'
                />
            </svg>
        </div>
    )
}

interface ImageErrorProps {
    className?: string
    message?: string
}

export const ImageError = ({
    className,
    message = 'Image not available',
}: ImageErrorProps) => {
    return (
        <div
            className={`flex flex-col items-center justify-center bg-gray-50 text-gray-400 ${
                className || ''
            }`}
        >
            <svg
                className='w-8 h-8 mb-2'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
            >
                <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                />
            </svg>
            <p className='text-xs text-center'>{message}</p>
        </div>
    )
}
