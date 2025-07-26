export default function CheckoutLoading() {
    return (
        <div className='flex flex-col items-center justify-center w-full min-h-full p-10 bg-white-oldlace'>
            <div className='h-full flex flex-col justify-center items-center w-full max-w-[1000px] gap-6'>
                <div className='w-full'>
                    {/* Header skeleton */}
                    <div className='bg-white rounded-lg shadow-sm border-2 border-black'>
                        <div className='px-6 py-4 border-b border-black'>
                            <div className='flex justify-between items-center'>
                                <div className='h-8 bg-gray-200 animate-pulse rounded w-1/4'></div>
                                <div className='h-6 bg-gray-200 animate-pulse rounded w-1/6'></div>
                            </div>
                        </div>

                        {/* Table rows skeleton */}
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className='px-6 py-4 border-b border-gray-100 last:border-b-0'
                            >
                                <div className='flex justify-between items-center'>
                                    <div className='flex-1'>
                                        <div className='h-5 bg-gray-200 animate-pulse rounded w-3/4 mb-2'></div>
                                        <div className='h-4 bg-gray-200 animate-pulse rounded w-1/4'></div>
                                    </div>
                                    <div className='h-6 bg-gray-200 animate-pulse rounded w-16'></div>
                                </div>
                            </div>
                        ))}

                        {/* Footer skeleton */}
                        <div className='px-6 py-4 bg-gray-50 border-t border-black'>
                            <div className='flex justify-between items-center'>
                                <div className='h-6 bg-gray-200 animate-pulse rounded w-1/6'></div>
                                <div className='h-6 bg-gray-200 animate-pulse rounded w-1/4'></div>
                            </div>
                        </div>
                    </div>

                    {/* Button skeleton */}
                    <div className='flex justify-end mt-6'>
                        <div className='h-12 bg-gray-200 animate-pulse rounded w-48'></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
