import { NextResponse } from 'next/server'
import { prisma } from '../../prisma'
import { safeTablatureSelect } from './utils'

export async function GET() {
    const tablatures = await prisma.tablature.findMany({
        select: safeTablatureSelect,
    })
    return NextResponse.json(tablatures)
}

export async function POST(request: Request) {
    const body = await request.json()
    const { artistIds, contents, ...tablatureData } = body

    const tablature = await prisma.tablature.create({
        data: {
            ...tablatureData,
            artists: {
                connect: artistIds.map((id: string) => ({ id })),
            },
            contents: {
                create: contents.map((content: any) => ({
                    type: content.type,
                    url: content.url,
                    rank: content.rank,
                })),
            },
        },
        include: {
            artists: true,
            contents: true,
        },
    })

    return NextResponse.json(tablature)
}
