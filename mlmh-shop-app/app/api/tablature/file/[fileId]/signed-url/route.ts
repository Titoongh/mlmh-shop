import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { auth } from '@clerk/nextjs/server'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { ScalewayService } from '@/services/scalewayv2'
import { z } from 'zod'

const paramsSchema = z.object({ fileId: z.string().min(1) })

interface Params {
    params: { fileId: string }
}

// Generate a signed download URL for a tablature file (requires prior access)
export async function GET(_req: Request, { params }: Params) {
    const parse = paramsSchema.safeParse(params)
    if (!parse.success)
        return NextResponse.json({ error: 'Invalid file id' }, { status: 400 })
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId)
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 },
        )
    const localUserId = await ensureLocalUser(clerkUserId)
    const file = await prisma.tablatureFile.findUnique({
        where: { id: parse.data.fileId },
        include: { tablature: { select: { id: true } } },
    })
    if (!file)
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
    const access = await prisma.tablatureAccess.findUnique({
        where: {
            userId_tablatureId: {
                userId: localUserId,
                tablatureId: file.tablatureId,
            },
        },
    })
    if (!access)
        return NextResponse.json(
            { error: 'No access for this tablature' },
            { status: 403 },
        )
    // The scalewayKey is stored; generate signed url
    const service = new ScalewayService()
    const signedUrl = await service.signedUrl(file.scalewayKey, undefined, 600)
    return NextResponse.json({ url: signedUrl, expiresIn: 600 })
}
