import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'

// Public list of published courses (minimal metadata) with simple cursor pagination
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(
            parseInt(searchParams.get('limit') || '20', 10),
            50,
        )
        const cursor = searchParams.get('cursor')

        const courses = await prisma.course.findMany({
            where: { published: true },
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                createdAt: true,
                updatedAt: true,
                tablature: { select: { id: true, title: true } },
            },
        })

        let nextCursor: string | null = null
        if (courses.length > limit) {
            const next = courses.pop()!
            nextCursor = next.id
        }

        return NextResponse.json({ items: courses, nextCursor })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
