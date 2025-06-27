import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { tablatureById } from '../utils'
import { Prisma } from '@prisma/client'

export const PUT = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const { artists, contents, files, musicalGenres, ...restBody } = await request.json()

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

    // Handle musical genres update if provided
    if (musicalGenres !== undefined) {
        updateData.musicalGenres = {
            set: [], // Remove all existing relationships
            connect: musicalGenres.map((id: string) => ({ id })),
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

    // Handle files update if provided
    if (files) {
        updateData.files = {
            deleteMany: {}, // Delete all existing file records
            create: files.map(
                (file: {
                    filename: string
                    scalewayKey: string
                    fileSize?: number
                    mimeType?: string
                }) => ({
                    filename: file.filename,
                    scalewayKey: file.scalewayKey,
                    fileSize: file.fileSize,
                    mimeType: file.mimeType,
                }),
            ),
        }
    }

    const tablature = await prisma.tablature.update({
        where: tablatureById(params.id),
        data: updateData,
        include: { artists: true, contents: true, files: true, musicalGenres: true },
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
