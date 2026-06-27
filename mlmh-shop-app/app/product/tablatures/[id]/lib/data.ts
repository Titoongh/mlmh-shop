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
                // Tag entité aligné sur lib/db/revalidate.ts (revalidateTablatures(id)).
                tags: [`tablature:${id}`, 'tablatures'],
                revalidate: 3600, // fallback temporel (invalidation principale par tag)
            },
        )(id)
    },
)
