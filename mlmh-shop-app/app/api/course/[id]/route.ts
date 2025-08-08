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
        const course = await prisma.course.findUnique({
            where: { id: params.id },
            include: { tablature: { select: { id: true, title: true } } },
        })
        if (!course || !course.published)
            return NextResponse.json({ error: 'Not found' }, { status: 404 })

        let enrolled = false
        if (clerkUserId) {
            const localUserId = await ensureLocalUser(clerkUserId)
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    courseId_userId: {
                        courseId: course.id,
                        userId: localUserId,
                    },
                },
            })
            enrolled = !!enrollment
        }

        return NextResponse.json({
            id: course.id,
            title: course.title,
            description: course.description,
            price: course.price,
            enrolled,
            tablature: course.tablature
                ? { id: course.tablature.id, title: course.tablature.title }
                : null,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
