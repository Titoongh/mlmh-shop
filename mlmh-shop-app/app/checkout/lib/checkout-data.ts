import { cache } from 'react'
import { prisma } from '@/app/prisma'
import { TablatureWithArtist } from '@/app/types/types'

// Cache the function to avoid duplicate database calls during SSR
export const getCartTablatures = cache(
    async (cartItemIds: string[]): Promise<TablatureWithArtist[]> => {
        if (cartItemIds.length === 0) {
            return []
        }

        try {
            const tablatures = await prisma.tablature.findMany({
                where: {
                    id: {
                        in: cartItemIds,
                    },
                },
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    title: true,
                    price: true,
                    publicationDate: true,
                    description: true,
                    musicalGenres: true,
                    contents: true,
                    hidden: true,
                    files: true,
                    artists: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            createdAt: true,
                            updatedAt: true,
                            hidden: true,
                            contents: true,
                        },
                    },
                },
            })

            return tablatures
        } catch (error) {
            console.error('Error fetching cart tablatures:', error)
            return []
        }
    },
)

export interface CheckoutPageData {
    isSuccess: boolean
    sessionId: string | null
    cartTablatures: TablatureWithArtist[]
}

export const getCheckoutPageData = cache(
    async (
        searchParams: URLSearchParams,
        cartItemIds: string[],
    ): Promise<CheckoutPageData> => {
        const isSuccess = searchParams.get('success') === 'true'
        const sessionId = searchParams.get('session_id')

        // If it's a success page, we don't need to fetch cart data
        const cartTablatures = isSuccess
            ? []
            : await getCartTablatures(cartItemIds)

        return {
            isSuccess,
            sessionId,
            cartTablatures,
        }
    },
)
