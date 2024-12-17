import { NextResponse } from 'next/server'
import { prisma } from '../../../prisma'
import { safeTablatureSelect, tablatureById } from '../utils'
import { Prisma } from '@prisma/client'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const tablature = await prisma.tablature.findUnique({
        where: tablatureById(params.id),
        select: {
            ...safeTablatureSelect,
            artists: { include: { contents: true } },
        },
    })
    return NextResponse.json(tablature)
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } },
) {
    const body: Prisma.TablatureCreateInput = await request.json()

    const tablature = await prisma.tablature.update({
        where: tablatureById(params.id),
        data: {
            ...body,
        },
        include: { artists: true },
    })

    return NextResponse.json(tablature)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const tablature = await prisma.tablature.delete({
        where: tablatureById(params.id),
    })
    return NextResponse.json(tablature)
}
