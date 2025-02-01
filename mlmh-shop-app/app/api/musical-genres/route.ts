import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export async function GET() {
    const musicalGenres = await prisma.musicalGenre.findMany({
        include: {
            tablatures: true,
        },
    })
    return NextResponse.json(musicalGenres)
}
