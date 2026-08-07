// Types partagés des formulaires admin (côté client).

export interface UploadedTabFile {
    filename: string
    scalewayKey: string
    fileSize?: number | null
    mimeType?: string | null
}

// Brouillon de contenu bonus (vidéo YouTube, audio, image) avant soumission.
// `file` est uploadé vers /api/admin/upload au moment du submit, puis remplacé
// par l'URL retournée. Le rank final = position dans la liste.
export interface ContentDraft {
    type: 'AUDIO' | 'VIDEO' | 'IMAGE'
    uploadType: 'url' | 'file'
    url: string
    file: File | null
}

export interface PickerOption {
    id: string
    name: string
}
