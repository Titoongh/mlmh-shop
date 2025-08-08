import { PrismaClient, LessonAssetType } from '@prisma/client'

const prisma = new PrismaClient({ log: ['warn', 'error'] })

/*
 * Seed two demo courses with a few lessons & placeholder assets.
 * Safe to run multiple times: uses upsert logic keyed by course title.
 * Replace scaleway placeholder keys with real uploaded objects later.
 */
async function upsertCourse(args: {
    title: string
    description: string
    price: number
    tablatureTitle?: string
    lessons: Array<{
        title: string
        description?: string
        order: number
        assets: Array<{
            type: LessonAssetType
            title?: string
            url: string
            durationMs?: number
        }>
    }>
}) {
    // If a tablatureTitle provided, find an existing tablature to link (or leave null)
    let tablatureConnect: { id: string } | undefined
    if (args.tablatureTitle) {
        const tab = await prisma.tablature.findFirst({
            where: {
                title: { contains: args.tablatureTitle, mode: 'insensitive' },
            },
            select: { id: true },
        })
        if (tab) tablatureConnect = { id: tab.id }
    }

    // Try find existing by title
    const existing = await prisma.course.findFirst({
        where: { title: args.title },
    })
    if (existing) {
        console.log(
            `Course '${args.title}' already exists -> skipping (id=${existing.id})`,
        )
        return existing
    }

    const created = await prisma.course.create({
        data: {
            title: args.title,
            description: args.description ?? null,
            price: args.price,
            published: true,
            ...(tablatureConnect
                ? { tablature: { connect: tablatureConnect } }
                : {}),
            lessons: {
                create: args.lessons.map(l => ({
                    title: l.title,
                    description: l.description ?? null,
                    order: l.order,
                    assets: { create: l.assets.map(a => ({ ...a })) },
                })),
            },
        },
    })
    const lessonCount = await prisma.courseLesson.count({
        where: { courseId: created.id },
    })
    console.log(`Created course '${created.title}' with ${lessonCount} lessons`)
    return created
}

async function main() {
    // Demo placeholder keys (replace with your real uploaded objects later)
    await upsertCourse({
        title: 'Fingerstyle Blues Foundations',
        description:
            'Core alternating bass, shuffle patterns & first turnarounds.',
        price: 39,
        tablatureTitle: 'Classic Song 1',
        lessons: [
            {
                title: 'Alternating Thumb Basics',
                order: 1,
                assets: [
                    {
                        type: 'VIDEO',
                        title: 'Lesson Video',
                        url: 'courses/blues-foundations/lesson-1/video.mp4',
                        durationMs: 6 * 60 * 1000,
                    },
                    {
                        type: 'AUDIO',
                        title: 'Slow Tempo Playthrough',
                        url: 'courses/blues-foundations/lesson-1/slow.mp3',
                        durationMs: 180000,
                    },
                    {
                        type: 'PDF',
                        title: 'Tablature PDF',
                        url: 'courses/blues-foundations/lesson-1/tab.pdf',
                    },
                ],
            },
            {
                title: 'Shuffle & Turnaround',
                order: 2,
                assets: [
                    {
                        type: 'VIDEO',
                        title: 'Lesson Video',
                        url: 'courses/blues-foundations/lesson-2/video.mp4',
                        durationMs: 7 * 60 * 1000,
                    },
                    {
                        type: 'AUDIO',
                        title: 'Full Tempo Playthrough',
                        url: 'courses/blues-foundations/lesson-2/full.mp3',
                        durationMs: 160000,
                    },
                ],
            },
        ],
    })

    await upsertCourse({
        title: 'Ragtime Fingerpicking Starter',
        description: 'Introduce syncopation & classic ragtime bass movement.',
        price: 42,
        lessons: [
            {
                title: 'Basic Syncopation',
                order: 1,
                assets: [
                    {
                        type: 'VIDEO',
                        title: 'Intro Video',
                        url: 'courses/ragtime-starter/lesson-1/intro.mp4',
                        durationMs: 5 * 60 * 1000,
                    },
                    {
                        type: 'PDF',
                        title: 'Syncopation Patterns',
                        url: 'courses/ragtime-starter/lesson-1/patterns.pdf',
                    },
                ],
            },
            {
                title: 'Classic Bass Walk',
                order: 2,
                assets: [
                    {
                        type: 'VIDEO',
                        title: 'Technique Focus',
                        url: 'courses/ragtime-starter/lesson-2/technique.mp4',
                        durationMs: 480000,
                    },
                    {
                        type: 'AUDIO',
                        title: 'Example Performance',
                        url: 'courses/ragtime-starter/lesson-2/example.mp3',
                        durationMs: 150000,
                    },
                ],
            },
        ],
    })
}

main()
    .then(() => console.log('Course seed complete'))
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
