export default function Loading() {
    return (
        <div className='flex flex-col items-center justify-center w-full h-full pb-10 my-10 bg-white'>
            <div className='w-[90%] max-w-[380px] lg:max-w-[1200px] h-full flex flex-col lg:flex-row justify-start items-center lg:justify-start lg:items-start gap-8 xl:gap-20'>
                {/* Skeleton for image/carousel area */}
                <div className='w-full max-w-[380px] h-[480px] flex flex-col'>
                    <div className='w-full h-[380px] border-2 border-gray-200 animate-pulse bg-gray-100'>
                        <div className='w-full h-20 bg-gray-200 border-b-2 border-gray-300'></div>
                        <div className='w-full h-[300px] bg-gray-100 flex items-center justify-center'>
                            <div className='w-32 h-32 bg-gray-200 rounded-lg'></div>
                        </div>
                    </div>
                    <div className='w-full h-[100px] mt-4 flex gap-2'>
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className='flex-1 h-full bg-gray-200 animate-pulse border border-gray-300'
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Skeleton for content area */}
                <div className='flex flex-col items-center justify-center w-full gap-10'>
                    <div className='flex flex-col items-start justify-start w-full h-full gap-10 break-words'>
                        <div className='flex flex-col w-full gap-4'>
                            {/* Title and price skeleton */}
                            <div className='flex flex-wrap items-start justify-between w-full gap-2'>
                                <div className='flex-1 min-w-0'>
                                    <div className='h-9 bg-gray-200 animate-pulse rounded w-3/4'></div>
                                </div>
                                <div className='flex-shrink-0'>
                                    <div className='h-9 bg-gray-200 animate-pulse rounded w-20'></div>
                                </div>
                            </div>

                            {/* Artist name skeleton */}
                            <div className='h-5 bg-gray-200 animate-pulse rounded w-1/3'></div>

                            {/* Description skeleton */}
                            <div className='pt-6 space-y-2'>
                                <div className='h-4 bg-gray-200 animate-pulse rounded'></div>
                                <div className='h-4 bg-gray-200 animate-pulse rounded w-5/6'></div>
                                <div className='h-4 bg-gray-200 animate-pulse rounded w-4/6'></div>
                            </div>
                        </div>

                        {/* Artist section skeleton */}
                        <div className='flex flex-col w-full gap-6'>
                            <div className='h-8 bg-gray-200 animate-pulse rounded w-1/2 border-b-2 border-gray-300 pb-2'></div>
                            <div className='flex items-center gap-4'>
                                <div className='w-16 h-16 bg-gray-200 animate-pulse border-2 border-gray-300'></div>
                                <div className='flex-1'>
                                    <div className='h-6 bg-gray-200 animate-pulse rounded w-1/2'></div>
                                </div>
                                <div className='w-4 h-4 bg-gray-200 animate-pulse rounded'></div>
                            </div>
                        </div>
                    </div>

                    {/* Button skeleton */}
                    <div className='flex flex-col items-center justify-center w-full gap-4'>
                        <div className='w-full h-12 bg-gray-200 animate-pulse rounded'></div>
                    </div>

                    {/* Warning text skeleton */}
                    <div className='space-y-2'>
                        <div className='h-3 bg-gray-200 animate-pulse rounded'></div>
                        <div className='h-3 bg-gray-200 animate-pulse rounded w-4/5'></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
