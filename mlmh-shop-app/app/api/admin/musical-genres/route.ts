import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export const dynamic = 'force-dynamic'

export const POST = async (request: Request) => {
    const body = await request.json()
    const MusicalGenre = await prisma.musicalGenre.create({
        data: body,
    })
    return NextResponse.json(MusicalGenre)
}
