import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { revalidateArtists } from '@/lib/db/revalidate'
import { generateUniqueSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export const PUT = async (request: Request, props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    const body = await request.json()
    const { contents, musicalGenres, slug: _ignoredSlug, ...artistData } = body

    // Slugs are stable: never change an existing one, only backfill if missing.
    const existing = await prisma.artist.findUnique({
        where: { id: params.id },
        select: { slug: true, name: true },
    })
    const slug =
        existing && !existing.slug
            ? await generateUniqueSlug(
                  artistData.name ?? existing.name,
                  async s =>
                      !!(await prisma.artist.findUnique({
                          where: { slug: s },
                          select: { id: true },
                      })),
              )
            : undefined

    const artist = await prisma.artist.update({
        where: { id: params.id },
        data: {
            ...artistData,
            ...(slug ? { slug } : {}),
            // Update musical genres
            musicalGenres: {
                set: [], // First clear existing connections
                connect: musicalGenres?.map((id: string) => ({ id })) || [], // Then connect new ones
            },
            // Update contents
            contents: {
                deleteMany: {}, // First delete all existing contents
                create:
                    contents?.map((content: any) => ({
                        type: content.type,
                        url: content.url,
                        rank: content.rank,
                    })) || [],
            },
        },
        include: {
            contents: true,
            musicalGenres: true,
        },
    })
    revalidateArtists(params.id)
    return NextResponse.json(artist)
}

export const DELETE = async (request: Request, props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    const artist = await prisma.artist.delete({
        where: { id: params.id },
    })
    revalidateArtists(params.id)
    return NextResponse.json(artist)
}
