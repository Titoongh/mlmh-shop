import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export const dynamic = 'force-dynamic'

export const PUT = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const body = await request.json()
    const { hidden } = body

    const artist = await prisma.artist.update({
        where: { id: params.id },
        data: {
            hidden: hidden,
        },
    })
    return NextResponse.json(artist)
}
