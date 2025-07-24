import { prisma } from '@/app/prisma'
import ListAllItemsClient from './ListAllItemsClient'
import type {
    ListAllItemsProps,
    ArtistItem,
    TablatureItem,
    ItemType,
} from './ListAllItems.types'

export const dynamic = 'force-dynamic'

// Server-side data fetching with proper error handling
async function getItems(
    type: ItemType,
): Promise<ArtistItem[] | TablatureItem[]> {
    try {
        if (type === 'artists') {
            const artists = await prisma.artist.findMany({
                select: {
                    id: true,
                    name: true,
                    hidden: true,
                },
                orderBy: {
                    name: 'asc',
                },
            })
            return artists
        } else {
            const tablatures = await prisma.tablature.findMany({
                select: {
                    id: true,
                    title: true,
                    hidden: true,
                    artists: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    title: 'asc',
                },
            })
            return tablatures
        }
    } catch (error) {
        console.error(`Error fetching ${type}:`, error)
        // Return empty array in case of error
        return []
    }
}

export default async function ListAllItemsServer({ type }: ListAllItemsProps) {
    const items = await getItems(type)

    return <ListAllItemsClient type={type} initialItems={items} />
}
