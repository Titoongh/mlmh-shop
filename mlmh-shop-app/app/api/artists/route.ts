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
