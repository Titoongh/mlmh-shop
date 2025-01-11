import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { MusicalGenre } from '@prisma/client'

export async function GET() {
    const musicalGenres = await prisma.musicalGenre.findMany({
        include: {
            tablatures: true,
        },
    })
    return NextResponse.json(musicalGenres)
}

export const POST = async (request: Request) => {
    const body = await request.json()
    const MusicalGenre = await prisma.musicalGenre.create({
        data: body,
    })
    return NextResponse.json(MusicalGenre)
}
