import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

export async function GET() {
    const tablatures = await prisma.tablature.findMany({
        select: {
            id: true,
            title: true,
            hidden: true,
        },
        orderBy: {
            title: 'asc',
        },
    })
    return NextResponse.json(tablatures)
}
