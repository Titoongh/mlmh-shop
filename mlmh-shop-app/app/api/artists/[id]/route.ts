import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { artistById } from '../utils'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const artist = await prisma.artist.findUnique({
        where: artistById(params.id),
    })
    return NextResponse.json(artist)
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } },
) {
    const body = await request.json()
    const artist = await prisma.artist.update({
        where: { id: params.id },
        data: body,
    })
    return NextResponse.json(artist)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const artist = await prisma.artist.delete({
        where: { id: params.id },
    })
    return NextResponse.json(artist)
}
