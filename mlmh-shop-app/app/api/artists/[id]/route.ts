import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { artistById } from '../utils'
import { safeTablatureSelect } from '../../tablatures/utils'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const artist = await prisma.artist.findUnique({
        where: artistById(params.id),
        include: {
            tablatures: {
                select: safeTablatureSelect,
            },
            contents: true,
            musicalGenres: true, // Added musicalGenres to include
        },
    })
    return NextResponse.json(artist)
}

export const PUT = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const body = await request.json()
    const { contents, musicalGenres, ...artistData } = body

    const artist = await prisma.artist.update({
        where: { id: params.id },
        data: {
            ...artistData,
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
    return NextResponse.json(artist)
}

export const DELETE = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const artist = await prisma.artist.delete({
        where: { id: params.id },
    })
    return NextResponse.json(artist)
}
