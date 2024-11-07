import { Artist, Content, Tablature } from '@prisma/client'

export interface ArtistWithTablatures extends Artist {
    tablatures: Tablature[]
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
