import { prisma } from '@/app/prisma'
import { safeMethodSelect } from '@/app/api/methods/utils'
import { MethodProduct } from '@/app/types/types'
import { isUuid } from '@/lib/slug'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

/**
 * Server-side data fetching for method products. Same double-layer caching as
 * the tablature product page: React cache() for request dedup + unstable_cache
 * for persistence. The select never exposes file storage keys (see
 * app/api/methods/utils.ts).
 */
export const getMethodProduct = cache(
    async (id: string): Promise<MethodProduct> => {
        return unstable_cache(
            async (productId: string) => {
                try {
                    // Accept either a slug (canonical URLs) or a UUID (defensive).
                    const method = await prisma.method.findUnique({
                        where: isUuid(productId)
                            ? { id: productId }
                            : { slug: productId },
                        select: {
                            ...safeMethodSelect,
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

                    if (!method || method.hidden) {
                        notFound()
                    }

                    return method as MethodProduct
                } catch (error) {
                    console.error('Error fetching method product:', error)
                    notFound()
                }
            },
            [`method-${id}`],
            {
                // Tag entité aligné sur lib/db/revalidate.ts (revalidateMethods(id)).
                tags: [`method:${id}`, 'methods'],
                revalidate: 3600, // fallback temporel (invalidation principale par tag)
            },
        )(id)
    },
)
