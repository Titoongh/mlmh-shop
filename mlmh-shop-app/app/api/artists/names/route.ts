import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export async function GET() {
    const artists = await prisma.artist.findMany({
        select: {
            id: true,
            name: true,
            hidden: true,
        },
        orderBy: {
            name: 'asc',
        },
    })
    return NextResponse.json(artists)
}
