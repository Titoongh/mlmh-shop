import Link from 'next/link'

export default function NotFound() {
    return (
        <div className='flex flex-col items-center justify-center w-full h-full min-h-[400px] pb-10 my-10 bg-white'>
            <div className='w-[90%] max-w-[380px] lg:max-w-[600px] h-full flex flex-col justify-center items-center gap-8 text-center'>
                <div className='flex flex-col gap-4'>
                    <h1 className='text-6xl font-bold text-black'>404</h1>
                    <h2 className='text-3xl font-bold text-black'>
                        Product Not Found
                    </h2>
                    <p className='text-lg text-gray-600'>
                        Sorry, the tablature you&apos;re looking for
                        doesn&apos;t exist or may have been removed.
                    </p>
                </div>

                <div className='flex flex-col sm:flex-row gap-4'>
                    <Link
                        href='/search'
                        className='px-6 py-3 bg-purple-dark text-white font-bold rounded hover:bg-purple-700 transition-colors'
                    >
                        Browse all tablatures
                    </Link>
                    <Link
                        href='/'
                        className='px-6 py-3 bg-gray-200 text-black font-bold rounded hover:bg-gray-300 transition-colors'
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    )
}
