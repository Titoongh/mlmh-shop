import { Artist, Content, MusicalGenre, Tablature } from '@prisma/client'

export interface ArtistWithTablaturesAndContents extends Artist {
    tablatures: TablatureWithMusicalGenres[]
    contents: Content[]
    musicalGenres: MusicalGenre[]
}

export interface TablatureWithMusicalGenres extends Tablature {
    musicalGenres: MusicalGenre[]
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
    genres: MusicalGenre[]
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
