import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/app/prisma'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().min(1) })
const postSchema = z.object({ content: z.string().min(1).max(5000) })

interface Params {
    params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
    const parse = paramsSchema.safeParse(params)
    if (!parse.success)
        return NextResponse.json(
            { error: 'Invalid tablature id' },
            { status: 400 },
        )
    const tablatureId = parse.data.id
    const comments = await prisma.tablatureComment.findMany({
        where: { tablatureId },
        orderBy: { createdAt: 'asc' },
        include: { user: true },
    })
    return NextResponse.json({
        comments: comments.map(c => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            isAdmin: c.isAdmin,
            user: { id: c.userId, email: c.user.email },
        })),
    })
}

export async function POST(req: Request, { params }: Params) {
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
    const tablatureId = parseParams.data.id
    const body = await req.json().catch(() => ({}))
    const parsed = postSchema.safeParse(body)
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    const localUserId = await ensureLocalUser(clerkUserId)
    const hasAccess = await prisma.tablatureAccess.findUnique({
        where: { userId_tablatureId: { userId: localUserId, tablatureId } },
    })
    if (!hasAccess)
        return NextResponse.json(
            { error: 'Access not claimed for this tablature' },
            { status: 403 },
        )
    const user = await prisma.user.findUnique({ where: { id: localUserId } })
    const isAdmin = user?.role === 'ADMIN'
    const comment = await prisma.tablatureComment.create({
        data: {
            tablatureId,
            userId: localUserId,
            content: parsed.data.content,
            isAdmin,
        },
    })
    return NextResponse.json({ id: comment.id })
}
