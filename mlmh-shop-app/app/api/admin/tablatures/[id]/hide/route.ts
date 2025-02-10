import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export const PUT = async (
    request: Request,
    { params }: { params: { id: string } },
) => {
    const body = await request.json()
    const { hidden } = body

    const tablature = await prisma.tablature.update({
        where: { id: params.id },
        data: {
            hidden: hidden,
        },
    })
    return NextResponse.json(tablature)
}
