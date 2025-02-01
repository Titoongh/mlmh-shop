import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { MusicalGenre } from '@prisma/client'

export const POST = async (request: Request) => {
    const body = await request.json()
    const { artists, contents, musicalGenres, ...tablatureData } = body

    console.log('tablatureData', tablatureData)
    console.log('artistIds', artists)
    console.log('contents', contents)

    const tablature = await prisma.tablature.create({
        data: {
            ...tablatureData,
            artists: {
                connect: artists.map((id: string) => ({ id })),
            },
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
            artists: true,
            contents: true,
        },
    })

    return NextResponse.json(tablature)
}
