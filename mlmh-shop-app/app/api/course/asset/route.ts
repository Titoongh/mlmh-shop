import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/app/prisma'
import { ensureLocalUser } from '@/app/utils/ensureUser'
import { z } from 'zod'
import { ScalewayService } from '@/services/scalewayv2'

const querySchema = z.object({ assetId: z.string().min(1) })

export async function GET(req: Request) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId)
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            )
        const { searchParams } = new URL(req.url)
        const assetId = searchParams.get('assetId')
        const parse = querySchema.safeParse({ assetId })
        if (!parse.success)
            return NextResponse.json(
                { error: 'Invalid asset id' },
                { status: 400 },
            )
        const localUserId = await ensureLocalUser(clerkUserId)
        const asset = await prisma.courseLessonAsset.findUnique({
            where: { id: parse.data.assetId },
            include: { lesson: { select: { courseId: true } } },
        })
        if (!asset)
            return NextResponse.json(
                { error: 'Asset not found' },
                { status: 404 },
            )
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: {
                    courseId: asset.lesson.courseId,
                    userId: localUserId,
                },
            },
        })
        if (!enrollment)
            return NextResponse.json(
                { error: 'Not enrolled in course' },
                { status: 403 },
            )
        let key = asset.url
        try {
            if (asset.url.startsWith('http')) {
                const u = new URL(asset.url)
                key = u.pathname.replace(/^\//, '')
            }
        } catch {}
        const service = new ScalewayService()
        const signedUrl = await service.signedUrl(key, undefined, 600)
        return NextResponse.json({ signedUrl, expiresIn: 600 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
