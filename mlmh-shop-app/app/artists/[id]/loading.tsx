import { GridSkeleton, Skeleton } from '@/app/components/ui/Skeleton'

// Skeleton de la page artiste : en-tête (image + infos) + grille de tablatures.
export default function Loading() {
    return (
        <div className='flex min-h-full w-full flex-col gap-8 bg-white-oldlace p-6 md:p-10'>
            <div className='mt-8 w-full rounded-lg bg-purple-light/10 p-4'>
                <div className='flex flex-col gap-6 md:flex-row'>
                    <Skeleton className='h-48 w-full flex-shrink-0 rounded-lg md:w-48' />
                    <div className='flex flex-grow flex-col gap-4'>
                        <Skeleton className='h-9 w-1/2' />
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-2/3' />
                        <Skeleton className='mt-auto h-5 w-40' />
                    </div>
                </div>
            </div>
            <div className='mt-10 w-full'>
                <Skeleton className='mb-6 h-8 w-40' />
                <GridSkeleton count={6} className='xl:grid-cols-3' />
            </div>
        </div>
    )
}
