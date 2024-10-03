import { Artist, Tablature } from '@prisma/client'

export interface ArtistWithTablatures extends Artist {
    tablatures: Tablature[]
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
