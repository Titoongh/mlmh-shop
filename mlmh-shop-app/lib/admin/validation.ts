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

// --- Méthodes -------------------------------------------------------------
// `ref` / `lessonRef` : référence CLIENT d'une leçon, permettant aux fichiers
// et offres de pointer vers des leçons créées dans la même requête. Pour une
// leçon existante, ref = son id en DB ; pour une nouvelle, n'importe quelle
// chaîne temporaire ("l1", "lesson-guitar-rag", …). Voir docs/admin-api.md.

export const methodLessonInputSchema = z.object({
    ref: z.string().min(1, 'Une ref de leçon est requise'),
    title: z.string().trim().min(1, 'Le titre de la leçon est requis'),
    rank: z.coerce.number().int().min(0),
})

export const methodFileInputSchema = z.object({
    filename: z.string().min(1),
    scalewayKey: z.string().min(1),
    fileSize: z.number().int().nullish(),
    mimeType: z.string().nullish(),
    role: z.enum(['DOCUMENT', 'AUDIO', 'VIDEO']),
    // null/absent = fichier niveau méthode (ex. couverture du livret)
    lessonRef: z.string().min(1).nullish(),
})

export const methodOfferInputSchema = z
    .object({
        // id d'une offre existante à mettre à jour (update uniquement)
        id: z.string().uuid().nullish(),
        kind: z.enum(['FULL', 'DOCUMENTS', 'LESSON']),
        // requis quand kind = LESSON, interdit sinon
        lessonRef: z.string().min(1).nullish(),
        title: z.string().trim().min(1, "Le titre de l'offre est requis"),
        price: z.coerce.number().min(0, 'Le prix doit être positif'),
        hidden: z.boolean().default(false),
    })
    .refine(o => o.kind !== 'LESSON' || !!o.lessonRef, {
        message: 'lessonRef est requis pour une offre LESSON',
    })
    .refine(o => o.kind === 'LESSON' || !o.lessonRef, {
        message: 'lessonRef est réservé aux offres LESSON',
    })

// Vérifications croisées leçons/fichiers/offres, partagées entre create et
// update (l'update autorise en plus les lessonRef pointant des leçons DB
// existantes, d'où le paramètre knownRefs).
export function checkMethodStructure(
    ctx: z.RefinementCtx,
    lessons: z.infer<typeof methodLessonInputSchema>[],
    files: z.infer<typeof methodFileInputSchema>[],
    offers: z.infer<typeof methodOfferInputSchema>[],
) {
    const refs = new Set(lessons.map(l => l.ref))
    if (refs.size !== lessons.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Les refs de leçons doivent être uniques',
            path: ['lessons'],
        })
    }
    files.forEach((file, i) => {
        if (file.lessonRef && !refs.has(file.lessonRef)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `lessonRef inconnu: ${file.lessonRef}`,
                path: ['files', i],
            })
        }
    })
    const activeOffers = offers.filter(o => !o.hidden)
    if (activeOffers.filter(o => o.kind === 'FULL').length > 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Une seule offre FULL visible par méthode',
            path: ['offers'],
        })
    }
    if (activeOffers.filter(o => o.kind === 'DOCUMENTS').length > 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Une seule offre DOCUMENTS visible par méthode',
            path: ['offers'],
        })
    }
    const lessonOfferRefs = activeOffers
        .filter(o => o.kind === 'LESSON')
        .map(o => o.lessonRef)
    if (new Set(lessonOfferRefs).size !== lessonOfferRefs.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Une seule offre LESSON visible par leçon',
            path: ['offers'],
        })
    }
    offers.forEach((offer, i) => {
        if (offer.lessonRef && !refs.has(offer.lessonRef)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `lessonRef inconnu: ${offer.lessonRef}`,
                path: ['offers', i],
            })
        }
    })
}

const methodBaseSchema = z.object({
    title: z.string().trim().min(1, 'Le titre est requis'),
    description: z
        .string()
        .transform(s => (s.trim() === '' ? null : s))
        .nullish(),
    hidden: z.boolean().default(false),
    publicationDate: z.coerce.date().nullish(),
    // Contrairement aux tablatures, les artistes sont optionnels.
    artists: z.array(z.string().min(1)).default([]),
    musicalGenres: z.array(z.string().min(1)).default([]),
    contents: z.array(contentInputSchema).default([]),
    lessons: z.array(methodLessonInputSchema).default([]),
    files: z.array(methodFileInputSchema).default([]),
    offers: z.array(methodOfferInputSchema).default([]),
})

export const methodCreateSchema = methodBaseSchema.superRefine((data, ctx) =>
    checkMethodStructure(ctx, data.lessons, data.files, data.offers),
)

// En update, tout est optionnel MAIS leçons/fichiers/offres se mettent à jour
// ENSEMBLE (la résolution des lessonRef exige la structure complète) —
// contrainte vérifiée dans lib/admin/methods.ts::updateMethod.
export const methodUpdateSchema = methodBaseSchema.partial()

export type TablatureCreateInput = z.infer<typeof tablatureCreateSchema>
export type TablatureUpdateInput = z.infer<typeof tablatureUpdateSchema>
export type ArtistCreateInput = z.infer<typeof artistCreateSchema>
export type ArtistUpdateInput = z.infer<typeof artistUpdateSchema>
export type ContentInput = z.infer<typeof contentInputSchema>
export type TablatureFileInput = z.infer<typeof tablatureFileInputSchema>
export type MethodCreateInput = z.infer<typeof methodCreateSchema>
export type MethodUpdateInput = z.infer<typeof methodUpdateSchema>
export type MethodLessonInput = z.infer<typeof methodLessonInputSchema>
export type MethodFileInput = z.infer<typeof methodFileInputSchema>
export type MethodOfferInput = z.infer<typeof methodOfferInputSchema>
