import { NextResponse } from 'next/server'
import { prisma } from '../../../prisma'
import { safeTablatureSelect, tablatureById } from '../utils'
import { Prisma } from '@prisma/client'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const tablature = await prisma.tablature.findUnique({
        where: tablatureById(params.id),
        select: {
            ...safeTablatureSelect,
            artists: { include: { contents: true } },
        },
    })
    return NextResponse.json(tablature)
}
