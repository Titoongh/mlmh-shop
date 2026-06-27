import { Skeleton } from '@/app/components/ui/Skeleton'

// Skeleton de la page produit : galerie + détails + CTA.
export default function Loading() {
    return (
        <div className='flex w-full flex-col gap-8 bg-white-oldlace p-6 md:flex-row md:p-10'>
            <Skeleton className='aspect-square w-full rounded-lg md:w-1/2' />
            <div className='flex w-full flex-col gap-5 md:w-1/2'>
                <Skeleton className='h-10 w-3/4' />
                <Skeleton className='h-6 w-1/3' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='mt-4 h-12 w-48 rounded-full' />
            </div>
        </div>
    )
}
