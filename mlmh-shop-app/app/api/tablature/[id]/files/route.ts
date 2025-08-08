import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { auth } from '@clerk/nextjs/server'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().min(1) })

interface Params {
    params: { id: string }
}

// List files for a tablature (only after access claimed). Returns metadata only (no signed URLs)
export async function GET(_req: Request, { params }: Params) {
    const parse = paramsSchema.safeParse(params)
    if (!parse.success)
        return NextResponse.json(
            { error: 'Invalid tablature id' },
            { status: 400 },
        )
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId)
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 },
        )
    const localUserId = await ensureLocalUser(clerkUserId)
    const tablatureId = parse.data.id
    const access = await prisma.tablatureAccess.findUnique({
        where: { userId_tablatureId: { userId: localUserId, tablatureId } },
    })
    if (!access)
        return NextResponse.json(
            { error: 'No access for this tablature' },
            { status: 403 },
        )
    const files = await prisma.tablatureFile.findMany({
        where: { tablatureId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, filename: true, fileSize: true, mimeType: true },
    })
    return NextResponse.json({ files })
}
