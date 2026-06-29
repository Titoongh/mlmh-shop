import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { tablatureById } from '../utils'
import { Prisma } from '@prisma/client'
import { revalidateTablatures } from '@/lib/db/revalidate'
import { generateUniqueSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export const PUT = async (request: Request, props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    try {
        const {
            artists,
            contents,
            files,
            musicalGenres,
            slug: _ignoredSlug,
            ...restBody
        } = await request.json()

        const updateData: Prisma.TablatureUpdateInput = {
            ...restBody,
        }

        // Slugs are stable: never change an existing one, only backfill if missing.
        const existing = await prisma.tablature.findUnique({
            where: tablatureById(params.id),
            select: { slug: true, title: true },
        })
        if (existing && !existing.slug) {
            let artistName = ''
            if (artists?.length) {
                const a = await prisma.artist.findUnique({
                    where: { id: artists[0] },
                    select: { name: true },
                })
                artistName = a?.name ?? ''
            }
            updateData.slug = await generateUniqueSlug(
                `${restBody.title ?? existing.title} ${artistName}`,
                async s =>
                    !!(await prisma.tablature.findUnique({
                        where: { slug: s },
                        select: { id: true },
                    })),
            )
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
            include: {
                artists: true,
                contents: true,
                files: true,
                musicalGenres: true,
            },
        })

        revalidateTablatures(params.id)
        return NextResponse.json(tablature)
    } catch (error) {
        console.error('Error updating tablature:', error)
        return NextResponse.json(
            {
                error: 'Failed to update tablature',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        )
    }
}

export const DELETE = async (request: Request, props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    const tablature = await prisma.tablature.delete({
        where: tablatureById(params.id),
    })
    revalidateTablatures(params.id)
    return NextResponse.json(tablature)
}
