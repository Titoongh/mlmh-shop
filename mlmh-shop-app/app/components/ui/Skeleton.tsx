import React from 'react'
import { cn } from '@/lib/utils'

// Primitives de skeleton réutilisables (chargements). Animation pulse cohérente
// partout, sur la base palette gris clair de l'app.

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-gray-200', className)}
            aria-hidden='true'
            {...props}
        />
    )
}

// Carte produit/tablature (image carrée + titre + sous-titre).
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-lg border-2 border-black/10 p-3',
                className,
            )}
        >
            <Skeleton className='aspect-square w-full rounded-md' />
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
        </div>
    )
}

// Grille de cartes.
export function GridSkeleton({
    count = 8,
    className,
}: {
    count?: number
    className?: string
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4',
                className,
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

// Rangée horizontale (carrousel de recommandations).
export function CarouselSkeleton({
    count = 5,
    title = true,
}: {
    count?: number
    title?: boolean
}) {
    return (
        <div className='flex flex-col gap-4'>
            {title && <Skeleton className='h-7 w-48' />}
            <div className='flex gap-6 overflow-hidden'>
                {Array.from({ length: count }).map((_, i) => (
                    <CardSkeleton
                        key={i}
                        className='w-[180px] flex-shrink-0 md:w-[220px]'
                    />
                ))}
            </div>
        </div>
    )
}
