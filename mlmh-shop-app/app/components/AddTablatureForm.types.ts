// Shared types for AddTablatureForm components
import {
    Artist,
    Content,
    MusicalGenre,
    Tablature,
    TablatureFile,
} from '@prisma/client'

// Form data interface
export interface TablatureFormData {
    title: string
    price: number
    downloadLink?: string
    description?: string
    artists: string[]
    musicalGenres?: string[]
    hidden: boolean
}

// File interface for tablature files
export interface TablatureFileData {
    filename: string
    scalewayKey: string
    fileSize?: number | null
    mimeType?: string | null
}

// Extended types with relations for better type safety
export type ArtistWithRelations = Artist & {
    contents?: Content[]
    musicalGenres?: MusicalGenre[]
}

export type TablatureWithRelations = Tablature & {
    artists?: Artist[]
    musicalGenres?: MusicalGenre[]
    contents?: Content[]
    files?: TablatureFile[]
}

// Component mode type
export type ComponentMode = 'create' | 'update'

// MultiFileUpload component props
export interface MultiFileUploadProps {
    onFilesUploaded: (files: TablatureFileData[]) => void
    title: string
    existingFiles?: TablatureFileData[]
}

// Props interfaces
export interface AddTablatureFormProps {
    id?: string | null | undefined
    mode: ComponentMode
}

export interface AddTablatureFormClientProps extends AddTablatureFormProps {
    initialArtists: ArtistWithRelations[]
    initialMusicalGenres: MusicalGenre[]
    initialTablature?: TablatureWithRelations | null
}

// Return type for server data fetching
export interface FormDataResponse {
    artists: ArtistWithRelations[]
    musicalGenres: MusicalGenre[]
    tablature: TablatureWithRelations | null
}
