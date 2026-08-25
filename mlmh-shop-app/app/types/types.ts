import {
    Artist,
    Content,
    Method,
    MethodFile,
    MethodLesson,
    MethodOffer,
    MusicalGenre,
    Tablature,
} from '@prisma/client'

export interface ArtistWithTablaturesAndContents extends Artist {
    tablatures: TablatureWithMusicalGenres[]
    contents: Content[]
    musicalGenres: MusicalGenre[]
    // Present only where the query includes them (e.g. artist page)
    methods?: MethodSummary[]
}

export interface TablatureWithMusicalGenres extends Tablature {
    musicalGenres: MusicalGenre[]
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
    musicalGenres: MusicalGenre[]
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
    initialCategory: SearchFilterEnum
    initialSearchQuery?: string
}

export enum SearchFilterEnum {
    ARTIST = 'Artists',
    TABLATURE = 'Tablatures',
    GENRE = 'Genres',
    METHOD = 'Methods',
}

// Public file manifest: what a method contains, without the storage keys
// (scalewayKey/filename must never reach public payloads).
export type MethodFileManifest = Pick<
    MethodFile,
    'id' | 'role' | 'lessonId' | 'fileSize' | 'mimeType'
>

export interface MethodOfferWithLesson extends MethodOffer {
    lesson: MethodLesson | null
}

export interface MethodSummary extends Method {
    contents: Content[]
    artists: ArtistWithContents[]
    musicalGenres: MusicalGenre[]
    offers: MethodOffer[]
    _count: { lessons: number }
}

export interface MethodProduct extends Method {
    contents: Content[]
    artists: ArtistWithContents[]
    musicalGenres: MusicalGenre[]
    lessons: MethodLesson[]
    offers: MethodOfferWithLesson[]
    files: MethodFileManifest[]
}

// Shape returned by /api/methods/batch for the checkout table.
export interface CheckoutMethodOfferLine extends MethodOffer {
    method: Pick<Method, 'id' | 'title' | 'slug'>
    lesson: Pick<MethodLesson, 'id' | 'title'> | null
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
