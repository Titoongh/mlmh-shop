import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { MusicalGenre } from '@prisma/client'

export const POST = async (request: Request) => {
    try {
        console.log('POST /api/admin/tablatures - Starting request')

        const body = await request.json()
        console.log('Request body received:', {
            hasArtists: !!body.artists,
            hasContents: !!body.contents,
            hasFiles: !!body.files,
            title: body.title,
        })

        const { artists, contents, musicalGenres, files, ...tablatureData } =
            body

        // Validate required fields
        if (!tablatureData.title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 },
            )
        }

        if (!artists || artists.length === 0) {
            return NextResponse.json(
                { error: 'At least one artist is required' },
                { status: 400 },
            )
        }

        console.log('Creating tablature with data:', tablatureData)

        const tablature = await prisma.tablature.create({
            data: {
                ...tablatureData,
                artists: {
                    connect: artists.map((id: string) => ({ id })),
                },
                musicalGenres: musicalGenres
                    ? {
                          connect: musicalGenres.map((id: string) => ({ id })),
                      }
                    : undefined,
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

        console.log('Tablature created successfully:', tablature.id)
        return NextResponse.json(tablature)
    } catch (error) {
        console.error('Error creating tablature:', error)

        // Handle Prisma-specific errors
        if (error instanceof Error) {
            if (error.message.includes('Foreign key constraint')) {
                return NextResponse.json(
                    {
                        error: 'Invalid artist or musical genre ID provided',
                        details: error.message,
                    },
                    { status: 400 },
                )
            }

            if (error.message.includes('Unique constraint')) {
                return NextResponse.json(
                    {
                        error: 'A tablature with this title already exists',
                        details: error.message,
                    },
                    { status: 409 },
                )
            }
        }

        return NextResponse.json(
            {
                error: 'Failed to create tablature',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        )
    }
}
