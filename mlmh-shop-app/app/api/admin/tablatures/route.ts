import { NextResponse } from 'next/server'
import {
    createTablature,
    listTablatures,
} from '@/lib/admin/tablatures'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

// Routes REST admin — wrappers fins sur lib/admin/* (validation zod, slug,
// revalidation). Auth : middleware proxy.ts (Clerk org:admin OU x-admin-api-key).
// Contrat documenté dans docs/admin-api.md — utilisé par le CLI tab-uploader.

export const dynamic = 'force-dynamic'

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')
        const hiddenParam = searchParams.get('hidden')
        const tablatures = await listTablatures({
            ...(q ? { q } : {}),
            ...(hiddenParam !== null
                ? { hidden: hiddenParam === 'true' }
                : {}),
        })
        return NextResponse.json(tablatures)
    } catch (error) {
        console.error('Error listing tablatures:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

export const POST = async (request: Request) => {
    try {
        const body = await request.json()
        const tablature = await createTablature(body)
        return NextResponse.json(tablature)
    } catch (error) {
        console.error('Error creating tablature:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
