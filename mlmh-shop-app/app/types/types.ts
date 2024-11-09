import { Artist, Content, Tablature } from '@prisma/client'

export interface ArtistWithTablatures extends Artist {
    tablatures: Tablature[]
}

export interface TablatureWithArtist extends Tablature {
    artists: Artist[]
}

export interface TablatureProduct extends Tablature {
    contents: Content[]
    artists: Artist[]
}

export interface SearchItem {
    type: 'artist' | 'tablature'
    id: string
    name: string
    image?: string
}

export interface SearchProps {
    initialData: ArtistWithTablatures[]
}

export enum SearchFilterEnum {
    ARTIST = 'Artists',
    TABLATURE = 'Tablatures',
}

export enum productType {
    TABLATURE = 'tablature',
    METHOD = 'method',
}

export interface CartItem {
    type: productType
    id: string
}

export interface Cart {
    items: CartItem[]
}

export enum LocalStorageEnum {
    CART = 'Cart',
}
