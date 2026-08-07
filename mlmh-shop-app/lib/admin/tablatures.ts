import { Prisma } from '@prisma/client'
import { prisma } from '@/app/prisma'
import { revalidateTablatures } from '@/lib/db/revalidate'
import { generateUniqueSlug } from '@/lib/slug'
import {
    tablatureCreateSchema,
    tablatureUpdateSchema,
} from './validation'

// Couche métier admin — source de vérité unique pour toutes les mutations
// tablatures. Consommée par les server actions (UI /admin) ET les routes REST
// /api/admin/tablatures* (CLI tab-uploader, outillage). Voir docs/admin-api.md.
//
// Les fonctions valident (zod), écrivent, puis revalident le cache. Elles
// jettent en cas d'erreur (ZodError, PrismaClientKnownRequestError) — les
// appelants formatent via adminErrorMessage().

export const adminTablatureInclude = {
    artists: true,
    musicalGenres: true,
    contents: true,
    files: true,
} satisfies Prisma.TablatureInclude

export type AdminTablature = Prisma.TablatureGetPayload<{
    include: typeof adminTablatureInclude
}>

async function uniqueTablatureSlug(title: string, firstArtistId?: string) {
    let artistName = ''
    if (firstArtistId) {
        const artist = await prisma.artist.findUnique({
            where: { id: firstArtistId },
            select: { name: true },
        })
        artistName = artist?.name ?? ''
    }
    return generateUniqueSlug(
        `${title} ${artistName}`,
        async s =>
            !!(await prisma.tablature.findUnique({
                where: { slug: s },
                select: { id: true },
            })),
    )
}

export interface ListTablaturesOptions {
    // Recherche plein-texte simple sur le titre ou le nom d'un artiste lié.
    q?: string
    // undefined = toutes ; true/false = filtre sur `hidden`.
    hidden?: boolean
}

export async function listTablatures(options: ListTablaturesOptions = {}) {
    const where: Prisma.TablatureWhereInput = {
        ...(options.hidden !== undefined ? { hidden: options.hidden } : {}),
        ...(options.q
            ? {
                  OR: [
                      { title: { contains: options.q, mode: 'insensitive' } },
                      {
                          artists: {
                              some: {
                                  name: {
                                      contains: options.q,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      },
                  ],
              }
            : {}),
    }

    return prisma.tablature.findMany({
        where,
        include: {
            artists: { select: { id: true, name: true } },
            musicalGenres: { select: { id: true, name: true } },
            _count: { select: { files: true, contents: true } },
        },
        orderBy: { title: 'asc' },
    })
}

export type AdminTablatureListItem = Awaited<
    ReturnType<typeof listTablatures>
>[number]

export async function getTablature(id: string): Promise<AdminTablature | null> {
    return prisma.tablature.findUnique({
        where: { id },
        include: adminTablatureInclude,
    })
}

export async function createTablature(input: unknown): Promise<AdminTablature> {
    const data = tablatureCreateSchema.parse(input)

    const slug = await uniqueTablatureSlug(data.title, data.artists[0])

    const tablature = await prisma.tablature.create({
        data: {
            title: data.title,
            slug,
            price: data.price,
            hidden: data.hidden,
            ...(data.description !== undefined
                ? { description: data.description }
                : {}),
            ...(data.publicationDate !== undefined
                ? { publicationDate: data.publicationDate }
                : {}),
            artists: { connect: data.artists.map(id => ({ id })) },
            musicalGenres: {
                connect: data.musicalGenres.map(id => ({ id })),
            },
            contents: {
                create: data.contents.map(c => ({
                    type: c.type,
                    url: c.url,
                    rank: c.rank,
                })),
            },
            files: {
                create: data.files.map(f => ({
                    filename: f.filename,
                    scalewayKey: f.scalewayKey,
                    ...(f.fileSize != null ? { fileSize: f.fileSize } : {}),
                    ...(f.mimeType != null ? { mimeType: f.mimeType } : {}),
                })),
            },
        },
        include: adminTablatureInclude,
    })

    revalidateTablatures(tablature.id)
    return tablature
}

export async function updateTablature(
    id: string,
    input: unknown,
): Promise<AdminTablature> {
    const data = tablatureUpdateSchema.parse(input)

    const updateData: Prisma.TablatureUpdateInput = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.hidden !== undefined ? { hidden: data.hidden } : {}),
        ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        ...(data.publicationDate !== undefined
            ? { publicationDate: data.publicationDate }
            : {}),
    }

    // Slugs stables : jamais modifiés, seulement backfillés s'ils manquent.
    const existing = await prisma.tablature.findUnique({
        where: { id },
        select: { slug: true, title: true },
    })
    if (existing && !existing.slug) {
        updateData.slug = await uniqueTablatureSlug(
            data.title ?? existing.title,
            data.artists?.[0],
        )
    }

    // Une relation absente du payload n'est pas touchée.
    if (data.artists !== undefined) {
        updateData.artists = {
            set: [],
            connect: data.artists.map(artistId => ({ id: artistId })),
        }
    }
    if (data.musicalGenres !== undefined) {
        updateData.musicalGenres = {
            set: [],
            connect: data.musicalGenres.map(genreId => ({ id: genreId })),
        }
    }
    if (data.contents !== undefined) {
        updateData.contents = {
            deleteMany: {},
            create: data.contents.map(c => ({
                type: c.type,
                url: c.url,
                rank: c.rank,
            })),
        }
    }
    if (data.files !== undefined) {
        updateData.files = {
            deleteMany: {},
            create: data.files.map(f => ({
                filename: f.filename,
                scalewayKey: f.scalewayKey,
                ...(f.fileSize != null ? { fileSize: f.fileSize } : {}),
                ...(f.mimeType != null ? { mimeType: f.mimeType } : {}),
            })),
        }
    }

    const tablature = await prisma.tablature.update({
        where: { id },
        data: updateData,
        include: adminTablatureInclude,
    })

    revalidateTablatures(id)
    return tablature
}

export async function setTablatureHidden(id: string, hidden: boolean) {
    const tablature = await prisma.tablature.update({
        where: { id },
        data: { hidden },
    })
    revalidateTablatures(id)
    return tablature
}

// Suppression définitive — non exposée dans l'UI (on utilise `hidden`), gardée
// pour l'API/outillage. Cascade sur contents/files ; échoue si des ventes
// (PurchaseItem/Download) y sont liées — c'est voulu.
export async function deleteTablature(id: string) {
    const tablature = await prisma.tablature.delete({ where: { id } })
    revalidateTablatures(id)
    return tablature
}
