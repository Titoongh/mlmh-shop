import { NextResponse } from 'next/server'
import { prisma } from '../../../prisma'
import { safeTablatureSelect, tablatureById } from '../utils'
import { Artist, Prisma } from '@prisma/client'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const tablature = await prisma.tablature.findUnique({
        where: tablatureById(params.id),
        select: {
            ...safeTablatureSelect,
            artists: { include: { contents: true } },
        },
    })
    return NextResponse.json(tablature)
}

export const PUT = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const { artists, contents, ...restBody } = await request.json()

    const updateData: Prisma.TablatureUpdateInput = {
        ...restBody,
    }

    // Handle artists update if provided
    if (artists) {
        updateData.artists = {
            set: [], // Remove all existing relationships
            connect: artists.map((id: string) => ({ id })),
        }
    }

    // Handle contents update if provided
    if (contents) {
        updateData.contents = {
            deleteMany: {}, // Delete all existing content records
            create: contents.map(
                (content: { type: string; url: string; rank: number }) => ({
                    type: content.type,
                    url: content.url,
                    rank: content.rank,
                }),
            ),
        }
    }

    const tablature = await prisma.tablature.update({
        where: tablatureById(params.id),
        data: updateData,
        include: { artists: true, contents: true },
    })

    return NextResponse.json(tablature)
}

export const DELETE = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const tablature = await prisma.tablature.delete({
        where: tablatureById(params.id),
    })
    return NextResponse.json(tablature)
}
