import { NextResponse } from 'next/server'
import { prisma } from '../../../prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const tablature = await prisma.tablature.findUnique({
        where: { id: Number(params.id) },
        include: { artists: { include: { artist: true } } },
    })
    return NextResponse.json(tablature)
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } },
) {
    const body = await request.json()
    const { artistIds, ...tablatureData } = body

    const tablature = await prisma.tablature.update({
        where: { id: Number(params.id) },
        data: {
            ...tablatureData,
            artists: {
                deleteMany: {},
                create: artistIds.map((id: number) => ({ artistId: id })),
            },
        },
        include: { artists: { include: { artist: true } } },
    })

    return NextResponse.json(tablature)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const tablature = await prisma.tablature.delete({
        where: { id: Number(params.id) },
    })
    return NextResponse.json(tablature)
}
