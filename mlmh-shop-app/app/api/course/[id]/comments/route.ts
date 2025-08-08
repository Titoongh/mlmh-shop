import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { auth } from '@clerk/nextjs/server'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { z } from 'zod'

interface Params {
    params: { id: string }
}

export async function GET(_: Request, { params }: Params) {
    try {
        const course = await prisma.course.findUnique({
            where: { id: params.id },
        })
        if (!course || !course.published)
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const comments = await prisma.courseComment.findMany({
            where: { courseId: params.id },
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
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

const postSchema = z.object({ content: z.string().min(1).max(5000) })

export async function POST(req: Request, { params }: Params) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId)
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            )
        const localUserId = await ensureLocalUser(clerkUserId)
        const body = await req.json()
        const parsed = postSchema.safeParse(body)
        if (!parsed.success)
            return NextResponse.json(
                { error: 'Invalid content' },
                { status: 400 },
            )
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: { courseId: params.id, userId: localUserId },
            },
        })
        if (!enrollment)
            return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
        const user = await prisma.user.findUnique({
            where: { id: localUserId },
        })
        const isAdmin = user?.role === 'ADMIN'
        const comment = await prisma.courseComment.create({
            data: {
                courseId: params.id,
                userId: localUserId,
                content: parsed.data.content,
                isAdmin,
            },
        })
        return NextResponse.json({ id: comment.id })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
