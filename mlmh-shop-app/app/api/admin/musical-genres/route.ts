import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { revalidateMusicalGenres } from '@/lib/db/revalidate'

export const dynamic = 'force-dynamic'

export const POST = async (request: Request) => {
    const body = await request.json()
    const MusicalGenre = await prisma.musicalGenre.create({
        data: body,
    })
    revalidateMusicalGenres()
    return NextResponse.json(MusicalGenre)
}
