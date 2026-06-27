import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { revalidateArtists } from '@/lib/db/revalidate'

export const dynamic = 'force-dynamic'

export const PUT = async (request: Request, props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    const body = await request.json()
    const { hidden } = body

    const artist = await prisma.artist.update({
        where: { id: params.id },
        data: {
            hidden: hidden,
        },
    })
    revalidateArtists(params.id)
    return NextResponse.json(artist)
}
