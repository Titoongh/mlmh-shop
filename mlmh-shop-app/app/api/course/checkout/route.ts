import { NextResponse } from 'next/server'
import { prisma } from '@/app/prisma'
import Stripe from 'stripe'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { ensureLocalUser } from '@/app/utils/ensureUser'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'fake-key', {
    apiVersion: '2024-09-30.acacia',
})

const schema = z.object({ courseId: z.string().uuid() })

export async function POST(req: Request) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            )
        }
        const body = await req.json()
        const parsed = schema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid payload', details: parsed.error.format() },
                { status: 400 },
            )
        }
        const course = await prisma.course.findUnique({
            where: { id: parsed.data.courseId },
        })
        if (!course || !course.published) {
            return NextResponse.json(
                { error: 'Course not found or unpublished' },
                { status: 404 },
            )
        }
        const localUserId = await ensureLocalUser(clerkUserId)
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: { courseId: course.id, userId: localUserId },
            },
        })
        if (existingEnrollment) {
            return NextResponse.json(
                { error: 'Already enrolled' },
                { status: 409 },
            )
        }
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.title,
                            metadata: { courseId: course.id, type: 'course' },
                        },
                        unit_amount: Math.round(course.price * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/course/${course.id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/course/${course.id}?canceled=true`,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
            metadata: { type: 'course', courseId: course.id, localUserId },
        })
        await prisma.coursePurchaseIntent.create({
            data: {
                stripeSessionId: session.id,
                courseId: course.id,
                userId: localUserId,
            },
        })
        return NextResponse.json({ url: session.url })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
