import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export async function GET() {
    const artists = await prisma.artist.findMany()
    return NextResponse.json(artists)
}

export async function POST(request: Request) {
    const body = await request.json()
    const artist = await prisma.artist.create({
        data: body,
    })
    return NextResponse.json(artist)
}
