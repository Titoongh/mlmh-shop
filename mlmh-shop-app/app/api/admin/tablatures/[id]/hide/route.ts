import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export const dynamic = 'force-dynamic'

export const PUT = async (request: Request, props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
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
