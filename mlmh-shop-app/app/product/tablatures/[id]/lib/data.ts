import { prisma } from '@/app/prisma'
import { safeTablatureSelect, tablatureById } from '@/app/api/tablatures/utils'
import { TablatureProduct } from '@/app/types/types'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

/**
 * Server-side data fetching function for tablature products
 * Uses React's cache() for deduplication and Next.js unstable_cache for persistent caching
 * This function will be cached per request and deduplicated if called multiple times
 */
export const getTablatureProduct = cache(
    async (id: string): Promise<TablatureProduct> => {
        return unstable_cache(
            async (productId: string) => {
                try {
                    const tablature = await prisma.tablature.findUnique({
                        where: tablatureById(productId),
                        select: {
                            ...safeTablatureSelect,
                            artists: {
                                include: {
                                    contents: {
                                        orderBy: { createdAt: 'asc' },
                                    },
                                },
                            },
                            contents: {
                                orderBy: { createdAt: 'asc' },
                            },
                        },
                    })

                    if (!tablature || tablature.hidden) {
                        notFound()
                    }

                    return tablature as TablatureProduct
                } catch (error) {
                    console.error('Error fetching tablature product:', error)
                    notFound()
                }
            },
            [`tablature-${id}`],
            {
                tags: [`tablature-${id}`, 'tablatures'],
                revalidate: 3600, // Cache for 1 hour
            },
        )(id)
    },
)

/**
 * Revalidate cached product data
 * This can be called when product data is updated
 */
export const revalidateProduct = async (id: string) => {
    try {
        // This would be used with Next.js revalidateTag if you set up tags
        // For now, it's a placeholder for future cache invalidation
        console.log(`Revalidating product cache for id: ${id}`)
    } catch (error) {
        console.error('Error revalidating product cache:', error)
    }
}
