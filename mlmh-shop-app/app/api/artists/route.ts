import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { Prisma } from '@prisma/client'

export async function GET() {
    const artists = await prisma.artist.findMany()
    return NextResponse.json(artists)
}

export async function POST(request: Request) {
    const body: Prisma.ArtistCreateInput = await request.json()
    const artist = await prisma.artist.create({
        data: body,
    })
    return NextResponse.json(artist)
}
