import { z } from 'zod'

// Schémas partagés par les server actions (UI admin) ET les routes REST
// /api/admin/* (CLI tab-uploader, outillage Claude). Une seule définition des
// entrées valides — voir docs/admin-api.md.
//
// `.strip()` (défaut zod) : les champs inconnus sont ignorés, pas rejetés —
// le CLI historique peut envoyer des champs en plus sans casser.

export const contentInputSchema = z.object({
    type: z.enum(['AUDIO', 'VIDEO', 'IMAGE']),
    url: z.string().trim().min(1, 'URL de contenu requise'),
    rank: z.coerce.number().int().min(0),
})

export const tablatureFileInputSchema = z.object({
    filename: z.string().min(1),
    scalewayKey: z.string().min(1),
    fileSize: z.number().int().nullish(),
    mimeType: z.string().nullish(),
})

export const tablatureCreateSchema = z.object({
    title: z.string().trim().min(1, 'Le titre est requis'),
    price: z.coerce.number().min(0, 'Le prix doit être positif').default(3.5),
    description: z
        .string()
        .transform(s => (s.trim() === '' ? null : s))
        .nullish(),
    hidden: z.boolean().default(false),
    publicationDate: z.coerce.date().nullish(),
    artists: z
        .array(z.string().min(1))
        .min(1, 'Au moins un artiste est requis'),
    musicalGenres: z.array(z.string().min(1)).default([]),
    contents: z.array(contentInputSchema).default([]),
    files: z.array(tablatureFileInputSchema).default([]),
})

// En update, tout est optionnel : une relation absente n'est PAS touchée
// (comportement historique de PUT /api/admin/tablatures/[id]).
export const tablatureUpdateSchema = tablatureCreateSchema.partial()

export const artistCreateSchema = z.object({
    name: z.string().trim().min(1, 'Le nom est requis'),
    description: z
        .string()
        .transform(s => (s.trim() === '' ? null : s))
        .nullish(),
    hidden: z.boolean().default(false),
    musicalGenres: z.array(z.string().min(1)).default([]),
    contents: z.array(contentInputSchema).default([]),
})

export const artistUpdateSchema = artistCreateSchema.partial()

export const genreInputSchema = z.object({
    name: z.string().trim().min(1, 'Le nom du genre est requis'),
})

export type TablatureCreateInput = z.infer<typeof tablatureCreateSchema>
export type TablatureUpdateInput = z.infer<typeof tablatureUpdateSchema>
export type ArtistCreateInput = z.infer<typeof artistCreateSchema>
export type ArtistUpdateInput = z.infer<typeof artistUpdateSchema>
export type ContentInput = z.infer<typeof contentInputSchema>
export type TablatureFileInput = z.infer<typeof tablatureFileInputSchema>
