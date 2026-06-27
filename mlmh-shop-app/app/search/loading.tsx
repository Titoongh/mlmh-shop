import { GridSkeleton, Skeleton } from '../components/ui/Skeleton'

// Skeleton de la recherche : barre de filtres + grille de résultats.
export default function Loading() {
    return (
        <div className='flex w-full flex-grow flex-col items-center gap-8 bg-white-oldlace pt-10 pb-8'>
            <div className='flex w-full max-w-5xl flex-col gap-6 px-4'>
                <Skeleton className='h-12 w-full rounded-full' />
                <div className='flex gap-3'>
                    <Skeleton className='h-8 w-24 rounded-full' />
                    <Skeleton className='h-8 w-24 rounded-full' />
                    <Skeleton className='h-8 w-24 rounded-full' />
                </div>
                <GridSkeleton count={8} />
            </div>
        </div>
    )
}
