import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export const POST = async (request: Request) => {
    const body = await request.json()
    const { contents, musicalGenres, ...artistData } = body
    const artist = await prisma.artist.create({
        data: {
            ...artistData,
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
    return NextResponse.json(artist)
}
