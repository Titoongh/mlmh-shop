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
