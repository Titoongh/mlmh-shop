'use client'

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
    return (
        <div className='flex flex-col items-center justify-center w-full h-full min-h-[400px] pb-10 my-10 bg-white'>
            <div className='w-[90%] max-w-[380px] lg:max-w-[600px] h-full flex flex-col justify-center items-center gap-8 text-center'>
                <div className='flex flex-col gap-4'>
                    <h1 className='text-4xl font-bold text-black'>
                        Oops! Something went wrong
                    </h1>
                    <p className='text-lg text-gray-600'>
                        We encountered an error while loading this product page.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <details className='mt-4 p-4 bg-gray-100 rounded border text-left'>
                            <summary className='font-medium cursor-pointer'>
                                Error details (development only)
                            </summary>
                            <pre className='mt-2 text-sm text-red-600 whitespace-pre-wrap'>
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>

                <div className='flex flex-col sm:flex-row gap-4'>
                    <button
                        onClick={reset}
                        className='px-6 py-3 bg-purple-dark text-white font-bold rounded hover:bg-purple-700 transition-colors'
                    >
                        Try again
                    </button>
                    <a
                        href='/search'
                        className='px-6 py-3 bg-gray-200 text-black font-bold rounded hover:bg-gray-300 transition-colors'
                    >
                        Browse other products
                    </a>
                </div>
            </div>
        </div>
    )
}
