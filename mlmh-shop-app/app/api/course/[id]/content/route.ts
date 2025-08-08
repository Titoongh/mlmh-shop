import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import { auth } from '@clerk/nextjs/server'
import { ensureLocalUser } from '@/app/utils/ensureUser'

interface Params {
    params: { id: string }
}

export async function GET(_: Request, { params }: Params) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId)
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            )
        const localUserId = await ensureLocalUser(clerkUserId)
        const course = await prisma.course.findUnique({
            where: { id: params.id },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                    include: { assets: true },
                },
            },
        })
        if (!course || !course.published)
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: { courseId: course.id, userId: localUserId },
            },
        })
        if (!enrollment)
            return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
        return NextResponse.json({
            id: course.id,
            title: course.title,
            description: course.description,
            lessons: course.lessons.map(l => ({
                id: l.id,
                title: l.title,
                description: l.description,
                order: l.order,
                assets: l.assets.map(a => ({
                    id: a.id,
                    type: a.type,
                    title: a.title,
                    url: a.url,
                    durationMs: a.durationMs,
                })),
            })),
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
