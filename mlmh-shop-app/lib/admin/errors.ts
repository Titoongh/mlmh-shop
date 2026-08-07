import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Traduit une erreur de la couche admin en message montrable (UI en français,
// réponses API). Les erreurs inattendues gardent un message générique — le
// détail part dans les logs serveur, pas chez le client.
export function adminErrorMessage(error: unknown): string {
    if (error instanceof z.ZodError) {
        return error.errors
            .map(e =>
                e.path.length ? `${e.path.join('.')} : ${e.message}` : e.message,
            )
            .join(' ; ')
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            return 'Un enregistrement avec ce nom/titre existe déjà.'
        }
        if (error.code === 'P2003') {
            return 'Référence invalide (artiste ou genre inexistant).'
        }
        if (error.code === 'P2025') {
            return 'Enregistrement introuvable.'
        }
    }
    if (error instanceof Error && error.message) return error.message
    return 'Une erreur inattendue est survenue.'
}

// Statut HTTP correspondant, pour les routes REST /api/admin/*.
export function adminErrorStatus(error: unknown): number {
    if (error instanceof z.ZodError) return 400
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') return 409
        if (error.code === 'P2003') return 400
        if (error.code === 'P2025') return 404
    }
    return 500
}
