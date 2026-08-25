'use server'

// Server actions de l'UI /admin — wrappers fins sur lib/admin/* (validation,
// écriture, revalidation). Chaque action commence par requireAdmin() : les
// server actions sont des endpoints HTTP, le middleware ne suffit pas.
// Retours à la façon du template : { success, id? } | { error }.

import { requireAdmin } from '@/lib/admin/auth'
import { adminErrorMessage } from '@/lib/admin/errors'
import {
    createTablature,
    updateTablature,
    setTablatureHidden,
} from '@/lib/admin/tablatures'
import {
    createArtist,
    updateArtist,
    setArtistHidden,
} from '@/lib/admin/artists'
import {
    createMethod,
    updateMethod,
    setMethodHidden,
} from '@/lib/admin/methods'
import { createGenre, updateGenre, deleteGenre } from '@/lib/admin/genres'

export type ActionResult = { success: true; id?: string } | { error: string }

export async function saveTablatureAction(
    id: string | null,
    payload: unknown,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        const tablature = id
            ? await updateTablature(id, payload)
            : await createTablature(payload)
        return { success: true, id: tablature.id }
    } catch (error) {
        console.error('saveTablatureAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function setTablatureHiddenAction(
    id: string,
    hidden: boolean,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        await setTablatureHidden(id, hidden)
        return { success: true, id }
    } catch (error) {
        console.error('setTablatureHiddenAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function saveMethodAction(
    id: string | null,
    payload: unknown,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        const method = id
            ? await updateMethod(id, payload)
            : await createMethod(payload)
        return { success: true, id: method.id }
    } catch (error) {
        console.error('saveMethodAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function setMethodHiddenAction(
    id: string,
    hidden: boolean,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        await setMethodHidden(id, hidden)
        return { success: true, id }
    } catch (error) {
        console.error('setMethodHiddenAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function saveArtistAction(
    id: string | null,
    payload: unknown,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        const artist = id
            ? await updateArtist(id, payload)
            : await createArtist(payload)
        return { success: true, id: artist.id }
    } catch (error) {
        console.error('saveArtistAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function setArtistHiddenAction(
    id: string,
    hidden: boolean,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        await setArtistHidden(id, hidden)
        return { success: true, id }
    } catch (error) {
        console.error('setArtistHiddenAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function createGenreAction(name: string): Promise<ActionResult> {
    try {
        await requireAdmin()
        const genre = await createGenre({ name })
        return { success: true, id: genre.id }
    } catch (error) {
        console.error('createGenreAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function renameGenreAction(
    id: string,
    name: string,
): Promise<ActionResult> {
    try {
        await requireAdmin()
        await updateGenre(id, { name })
        return { success: true, id }
    } catch (error) {
        console.error('renameGenreAction:', error)
        return { error: adminErrorMessage(error) }
    }
}

export async function deleteGenreAction(id: string): Promise<ActionResult> {
    try {
        await requireAdmin()
        await deleteGenre(id)
        return { success: true, id }
    } catch (error) {
        console.error('deleteGenreAction:', error)
        return { error: adminErrorMessage(error) }
    }
}
