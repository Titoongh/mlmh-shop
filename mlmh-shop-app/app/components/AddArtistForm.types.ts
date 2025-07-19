// Shared types for AddArtistForm components
import { Artist, Content, MusicalGenre } from '@prisma/client'

// Form data interface
export interface ArtistFormData {
    name: string
    description?: string
    musicalGenres: string[]
    hidden: boolean
}

// Extended types with relations for better type safety
export type ArtistWithRelations = Artist & {
    contents?: Content[]
    musicalGenres?: MusicalGenre[]
}

// Component mode type
export type ComponentMode = 'create' | 'update'

// Server response interface
export interface FormDataResponse {
    musicalGenres: MusicalGenre[]
    artist: ArtistWithRelations | null
}

// Base component props
export interface AddArtistFormProps {
    id?: string | null | undefined
    mode?: ComponentMode
    onSuccess?: () => void
}

// Client component specific props (extends base with initial data)
export interface AddArtistFormClientProps extends AddArtistFormProps {
    initialMusicalGenres: MusicalGenre[]
    initialArtist: ArtistWithRelations | null
    onSuccess?: () => void
}
