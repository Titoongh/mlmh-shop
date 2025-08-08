import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/app/prisma'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { ScalewayService } from '@/services/scalewayv2'

// Returns a short-lived signed URL for a course lesson asset if the user is enrolled.
// Path param: asset id.
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const localUserId = await ensureLocalUser(userId)

        const asset = await prisma.courseLessonAsset.findUnique({
            where: { id: params.id },
            include: {
                lesson: {
                    include: { course: true },
                },
            },
        })

        if (!asset) {
            return NextResponse.json(
                { error: 'Asset not found' },
                { status: 404 },
            )
        }

        // Check enrollment
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: {
                    courseId: asset.lesson.courseId,
                    userId: localUserId,
                },
            },
        })

        if (!enrollment) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Generate signed URL (assuming asset.url stores the object key or full path)
        const storage = new ScalewayService()
        const objectKey = asset.url // If asset.url is a full URL, you'd parse to extract key.
        const signedUrl = await storage.signedUrl(objectKey, undefined, 60 * 10) // 10 min validity

        return NextResponse.json({ url: signedUrl })
    } catch (e: any) {
        console.error('Signed URL error', e)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}
