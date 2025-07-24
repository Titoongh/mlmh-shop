// Shared types for ListAllItems components

export interface ArtistItem {
    id: string
    name: string
    hidden: boolean
}

export interface TablatureItem {
    id: string
    title: string
    hidden: boolean
    artists: { name: string; id: string }[]
}

export type ItemType = 'artists' | 'tablatures'

export interface ListAllItemsProps {
    type: ItemType
}

export interface ListAllItemsClientProps extends ListAllItemsProps {
    initialItems: ArtistItem[] | TablatureItem[]
}

// Type guard functions
export function isArtistItem(
    item: ArtistItem | TablatureItem,
): item is ArtistItem {
    return 'name' in item
}

export function isTablatureItem(
    item: ArtistItem | TablatureItem,
): item is TablatureItem {
    return 'title' in item
}
