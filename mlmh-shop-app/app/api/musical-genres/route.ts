import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { MusicalGenre } from '@prisma/client'
import { withAuth } from '../../../lib/firebase/withAuth'

export async function GET() {
    const musicalGenres = await prisma.musicalGenre.findMany({
        include: {
            tablatures: true,
        },
    })
    return NextResponse.json(musicalGenres)
}

export const POST = withAuth(async (request: Request) => {
    const body = await request.json()
    console.log('NEW MusicalGenre body', body)
    const MusicalGenre = await prisma.musicalGenre.create({
        data: body,
    })
    console.log('NEW MusicalGenre', MusicalGenre)
    return NextResponse.json(MusicalGenre)
})
