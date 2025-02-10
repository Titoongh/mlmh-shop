import { NextResponse } from 'next/server'
import { prisma } from '../../prisma'
import { safeTablatureSelect } from './utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    const tablatures = await prisma.tablature.findMany({
        select: safeTablatureSelect,
        where: {
            hidden: false,
        },
    })
    return NextResponse.json(tablatures)
}
