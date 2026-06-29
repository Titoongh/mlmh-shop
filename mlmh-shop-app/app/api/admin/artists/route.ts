import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { revalidateArtists } from '@/lib/db/revalidate'
import { generateUniqueSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export const POST = async (request: Request) => {
    const body = await request.json()
    const { contents, musicalGenres, ...artistData } = body
    // Generate a stable, unique slug from the artist name.
    const slug = await generateUniqueSlug(
        artistData.name ?? '',
        async s =>
            !!(await prisma.artist.findUnique({
                where: { slug: s },
                select: { id: true },
            })),
    )
    const artist = await prisma.artist.create({
        data: {
            ...artistData,
            slug,
            musicalGenres: {
                connect: musicalGenres.map((id: string) => ({ id })),
            },
            contents: {
                create: contents.map((content: any) => ({
                    type: content.type,
                    url: content.url,
                    rank: content.rank,
                })),
            },
        },
        include: {
            contents: true,
            musicalGenres: true,
        },
    })
    revalidateArtists(artist.id)
    return NextResponse.json(artist)
}

export const GET = async () => {
    const artists = await prisma.artist.findMany({
        include: {
            contents: true,
            musicalGenres: true,
        },
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(artists)
}
