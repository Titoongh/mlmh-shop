import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../tablatures/utils'

export async function GET() {
    const artists = await prisma.artist.findMany({
        include: {
            tablatures: { select: safeTablatureSelect },
            contents: true,
            musicalGenres: true,
        },
    })
    return NextResponse.json(artists)
}

export async function POST(request: Request) {
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
