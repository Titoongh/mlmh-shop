import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { artistById } from '../utils'
import { safeTablatureSelect } from '../../tablatures/utils'
import { withAuth } from '../../../../lib/firebase/withAuth'

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    const artist = await prisma.artist.findUnique({
        where: artistById(params.id),
        include: {
            tablatures: {
                select: safeTablatureSelect,
            },
            contents: true,
        },
    })
    console.log('artist', artist)
    return NextResponse.json(artist)
}

export const PUT = withAuth(
    async (request: Request, { params }: { params: { id: string } }) => {
        const body = await request.json()
        const artist = await prisma.artist.update({
            where: { id: params.id },
            data: body,
        })
        return NextResponse.json(artist)
    },
)

export const DELETE = withAuth(
    async (request: Request, { params }: { params: { id: string } }) => {
        const artist = await prisma.artist.delete({
            where: { id: params.id },
        })
        return NextResponse.json(artist)
    },
)
