import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { safeTablatureSelect } from '../tablatures/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    const artists = await prisma.artist.findMany({
        include: {
            tablatures: {
                select: safeTablatureSelect,
                where: { hidden: false },
            },
            contents: true,
            musicalGenres: true,
        },
        where: {
            hidden: false,
        },
    })
    return NextResponse.json(artists)
}
