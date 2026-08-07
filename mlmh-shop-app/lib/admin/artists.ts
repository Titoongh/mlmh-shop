import { Prisma } from '@prisma/client'
import { prisma } from '@/app/prisma'
import { revalidateArtists } from '@/lib/db/revalidate'
import { generateUniqueSlug } from '@/lib/slug'
import { artistCreateSchema, artistUpdateSchema } from './validation'

// Couche métier admin pour les artistes — même rôle que lib/admin/tablatures.ts.

export const adminArtistInclude = {
    contents: true,
    musicalGenres: true,
} satisfies Prisma.ArtistInclude

export type AdminArtist = Prisma.ArtistGetPayload<{
    include: typeof adminArtistInclude
}>

async function uniqueArtistSlug(name: string) {
    return generateUniqueSlug(
        name,
        async s =>
            !!(await prisma.artist.findUnique({
                where: { slug: s },
                select: { id: true },
            })),
    )
}

export interface ListArtistsOptions {
    q?: string
    hidden?: boolean
}

export async function listArtists(options: ListArtistsOptions = {}) {
    const where: Prisma.ArtistWhereInput = {
        ...(options.hidden !== undefined ? { hidden: options.hidden } : {}),
        ...(options.q
            ? { name: { contains: options.q, mode: 'insensitive' } }
            : {}),
    }

    return prisma.artist.findMany({
        where,
        include: {
            musicalGenres: { select: { id: true, name: true } },
            _count: { select: { tablatures: true } },
        },
        orderBy: { name: 'asc' },
    })
}

export type AdminArtistListItem = Awaited<
    ReturnType<typeof listArtists>
>[number]

export async function getArtist(id: string): Promise<AdminArtist | null> {
    return prisma.artist.findUnique({
        where: { id },
        include: adminArtistInclude,
    })
}

export async function createArtist(input: unknown): Promise<AdminArtist> {
    const data = artistCreateSchema.parse(input)

    const slug = await uniqueArtistSlug(data.name)

    const artist = await prisma.artist.create({
        data: {
            name: data.name,
            slug,
            hidden: data.hidden,
            ...(data.description !== undefined
                ? { description: data.description }
                : {}),
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
        },
        include: adminArtistInclude,
    })

    revalidateArtists(artist.id)
    return artist
}

export async function updateArtist(
    id: string,
    input: unknown,
): Promise<AdminArtist> {
    const data = artistUpdateSchema.parse(input)

    const updateData: Prisma.ArtistUpdateInput = {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.hidden !== undefined ? { hidden: data.hidden } : {}),
        ...(data.description !== undefined
            ? { description: data.description }
            : {}),
    }

    // Slugs stables : backfill uniquement.
    const existing = await prisma.artist.findUnique({
        where: { id },
        select: { slug: true, name: true },
    })
    if (existing && !existing.slug) {
        updateData.slug = await uniqueArtistSlug(data.name ?? existing.name)
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

    const artist = await prisma.artist.update({
        where: { id },
        data: updateData,
        include: adminArtistInclude,
    })

    revalidateArtists(id)
    return artist
}

export async function setArtistHidden(id: string, hidden: boolean) {
    const artist = await prisma.artist.update({
        where: { id },
        data: { hidden },
    })
    revalidateArtists(id)
    return artist
}

// Suppression définitive — non exposée dans l'UI (on utilise `hidden`).
export async function deleteArtist(id: string) {
    const artist = await prisma.artist.delete({ where: { id } })
    revalidateArtists(id)
    return artist
}
