import { Artist, Content, Tablature } from '@prisma/client'

export interface ArtistWithTablaturesAndContents extends Artist {
    tablatures: Tablature[]
    contents: Content[]
}

export interface ArtistWithContents extends Artist {
    contents: Content[]
}

export interface TablatureWithArtist extends Tablature {
    artists: ArtistWithContents[]
}

export interface TablatureProduct extends Tablature {
    contents: Content[]
    artists: ArtistWithContents[]
}

export interface SearchItem {
    type: 'artist' | 'tablature'
    id: string
    name: string
    image?: string
}

export interface SearchProps {
    initialData: ArtistWithTablaturesAndContents[]
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
