import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { auth } from '@clerk/nextjs/server'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().min(1) })
const bodySchema = z.object({ sessionId: z.string().min(1) })

interface Params {
    params: { id: string }
}

export async function POST(req: Request, { params }: Params) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId)
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            )
        const parseParams = paramsSchema.safeParse(params)
        if (!parseParams.success)
            return NextResponse.json(
                { error: 'Invalid tablature id' },
                { status: 400 },
            )
        const body = await req.json().catch(() => ({}))
        const parseBody = bodySchema.safeParse(body)
        if (!parseBody.success)
            return NextResponse.json(
                { error: 'Invalid session id' },
                { status: 400 },
            )
        const tablatureId = parseParams.data.id
        const sessionId = parseBody.data.sessionId
        const localUserId = await ensureLocalUser(clerkUserId)
        // Validate that this session corresponds to a successful tablature downloadIntent
        const intent = await prisma.downloadIntent.findFirst({
            where: { stripeSessionId: sessionId, success: true },
            include: {
                downloads: {
                    where: { tablatureId },
                    select: { id: true },
                },
            },
        })
        if (!intent || intent.downloads.length === 0)
            return NextResponse.json(
                {
                    error: 'No successful purchase for this tablature and sessionId',
                },
                { status: 404 },
            )
        const access = await prisma.tablatureAccess.upsert({
            where: { userId_tablatureId: { userId: localUserId, tablatureId } },
            update: {},
            create: { userId: localUserId, tablatureId },
        })
        return NextResponse.json({ access })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
