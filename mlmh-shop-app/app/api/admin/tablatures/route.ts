import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { MusicalGenre } from '@prisma/client'

export const POST = async (request: Request) => {
    const body = await request.json()
    const { artists, contents, musicalGenres, files, ...tablatureData } = body

    const tablature = await prisma.tablature.create({
        data: {
            ...tablatureData,
            artists: {
                connect: artists.map((id: string) => ({ id })),
            },
            musicalGenres: musicalGenres ? {
                connect: musicalGenres.map((id: string) => ({ id })),
            } : undefined,
            contents: {
                create: contents.map((content: any) => ({
                    type: content.type,
                    url: content.url,
                    rank: content.rank,
                })),
            },
            files: files
                ? {
                      create: files.map((file: any) => ({
                          filename: file.filename,
                          scalewayKey: file.scalewayKey,
                          fileSize: file.fileSize,
                          mimeType: file.mimeType,
                      })),
                  }
                : undefined,
        },
        include: {
            artists: true,
            contents: true,
            files: true,
            musicalGenres: true,
        },
    })

    return NextResponse.json(tablature)
}
