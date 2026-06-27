import { revalidateTag } from 'next/cache'

// Invalidation ciblée par tags après une mutation (create/update/hide/delete).
// Chaque lecture cachée dans lib/db/* est taguée ; on invalide ici les MÊMES tags
// pour que Next régénère uniquement ce qui dépend de la donnée modifiée.
//
// Pattern : un tag "collection" large (ex. 'tablatures') couvrant toutes les
// listes, + des tags fins (ex. `tablature:${id}`) pour invalider une entité
// précise (page produit/artiste) sans reconstruire tout le reste.
//
// Next 16 : revalidateTag(tag, profile) — le 2e argument est requis ({} = défaut).

// Tags "collection" — doivent matcher ceux déclarés dans lib/db/*.
export const TAGS = {
    tablatures: 'tablatures',
    artists: 'artists',
    musicalGenres: 'musical-genres',
} as const

function safeRevalidate(tag: string) {
    try {
        revalidateTag(tag, {})
    } catch (e) {
        console.error('revalidateTag:', tag, e)
    }
}

// Une tablature a changé (create/update/hide). Invalide la collection (home,
// recherche, listes) + la page produit précise si un id est fourni.
export function revalidateTablatures(id?: string) {
    safeRevalidate(TAGS.tablatures)
    if (id) safeRevalidate(`tablature:${id}`)
}

// Un artiste a changé. Invalide la collection artistes + la page artiste précise.
// Les listes de tablatures embarquent le nom de l'artiste → on invalide aussi
// la collection tablatures par sécurité.
export function revalidateArtists(id?: string) {
    safeRevalidate(TAGS.artists)
    safeRevalidate(TAGS.tablatures)
    if (id) safeRevalidate(`artist:${id}`)
}

export function revalidateMusicalGenres() {
    safeRevalidate(TAGS.musicalGenres)
}
