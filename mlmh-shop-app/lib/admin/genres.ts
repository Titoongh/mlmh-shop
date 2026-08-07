import { prisma } from '@/app/prisma'
import {
    revalidateMusicalGenres,
    revalidateTablatures,
    revalidateArtists,
} from '@/lib/db/revalidate'
import { genreInputSchema } from './validation'

// Couche métier admin pour les genres musicaux. Modèle minimal (id + name,
// pas de hidden/slug) → CRUD complet, y compris la suppression (elle ne fait
// que délier les artistes/tablatures, aucune donnée de vente n'y est liée).

export async function listGenres() {
    return prisma.musicalGenre.findMany({
        include: {
            _count: { select: { artists: true, tablatures: true } },
        },
        orderBy: { name: 'asc' },
    })
}

export type AdminGenreListItem = Awaited<ReturnType<typeof listGenres>>[number]

export async function createGenre(input: unknown) {
    const data = genreInputSchema.parse(input)
    const genre = await prisma.musicalGenre.create({ data })
    revalidateMusicalGenres()
    return genre
}

export async function updateGenre(id: string, input: unknown) {
    const data = genreInputSchema.parse(input)
    const genre = await prisma.musicalGenre.update({
        where: { id },
        data,
    })
    // Le nom du genre apparaît sur les pages produits/artistes déjà rendues.
    revalidateMusicalGenres()
    revalidateTablatures()
    revalidateArtists()
    return genre
}

export async function deleteGenre(id: string) {
    const genre = await prisma.musicalGenre.delete({ where: { id } })
    revalidateMusicalGenres()
    revalidateTablatures()
    revalidateArtists()
    return genre
}
