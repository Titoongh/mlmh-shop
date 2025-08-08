import { prisma } from '@/app/prisma'
import { clerkClient } from '@clerk/nextjs/server'

/** Ensures a local User record exists for the Clerk user; returns local user id. */
export async function ensureLocalUser(clerkUserId: string): Promise<string> {
    const existing = await prisma.user.findUnique({ where: { clerkUserId } })
    if (existing) return existing.id

    const clerkClt = await clerkClient()
    const clerkUser = await clerkClt.users.getUser(clerkUserId)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress
    if (!email) throw new Error('User has no primary email')

    const created = await prisma.user.create({
        data: { clerkUserId, email },
    })
    return created.id
}
