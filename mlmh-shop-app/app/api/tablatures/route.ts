import { NextResponse } from 'next/server'
import { prisma } from '../../prisma'

export async function GET() {
    const tablatures = await prisma.tablature.findMany({
        include: { artists: true },
    })
    return NextResponse.json(tablatures)
}

export async function POST(request: Request) {
    const body = await request.json()
    const { artistIds, ...tablatureData } = body

    const tablature = await prisma.tablature.create({
        data: {
            ...tablatureData,
            artists: {
                connect: artistIds.map((id: number) => ({ id })),
            },
        },
        include: { artists: true },
    })

    return NextResponse.json(tablature)
}
