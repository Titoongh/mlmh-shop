import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const artist = await prisma.artist.findUnique({
        where: { id: Number(params.id) },
    })
    return NextResponse.json(artist)
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } },
) {
    const body = await request.json()
    const artist = await prisma.artist.update({
        where: { id: Number(params.id) },
        data: body,
    })
    return NextResponse.json(artist)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const artist = await prisma.artist.delete({
        where: { id: Number(params.id) },
    })
    return NextResponse.json(artist)
}
