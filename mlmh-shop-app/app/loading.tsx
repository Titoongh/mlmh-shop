import { CarouselSkeleton } from './components/ui/Skeleton'

// Skeleton de la home : carrousels de recommandations.
export default function Loading() {
    return (
        <div className='flex w-full flex-col gap-12 bg-white-oldlace p-6 md:p-10'>
            <CarouselSkeleton />
            <CarouselSkeleton />
            <CarouselSkeleton />
        </div>
    )
}
