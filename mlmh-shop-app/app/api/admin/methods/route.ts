import { NextResponse } from 'next/server'
import { createMethod, listMethods } from '@/lib/admin/methods'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

// Routes REST admin méthodes — wrappers fins sur lib/admin/methods.ts. Auth :
// middleware proxy.ts (Clerk org:admin OU x-admin-api-key). Contrat documenté
// dans docs/admin-api.md — pensé pour le futur CLI method-uploader.

export const dynamic = 'force-dynamic'

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')
        const hiddenParam = searchParams.get('hidden')
        const methods = await listMethods({
            ...(q ? { q } : {}),
            ...(hiddenParam !== null
                ? { hidden: hiddenParam === 'true' }
                : {}),
        })
        return NextResponse.json(methods)
    } catch (error) {
        console.error('Error listing methods:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

export const POST = async (request: Request) => {
    try {
        const body = await request.json()
        const method = await createMethod(body)
        return NextResponse.json(method)
    } catch (error) {
        console.error('Error creating method:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
