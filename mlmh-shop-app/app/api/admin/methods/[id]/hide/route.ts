import { NextResponse } from 'next/server'
import { setMethodHidden } from '@/lib/admin/methods'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const PUT = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const { hidden } = await request.json()
        if (typeof hidden !== 'boolean') {
            return NextResponse.json(
                { error: '`hidden` doit être un booléen' },
                { status: 400 },
            )
        }
        const method = await setMethodHidden(params.id, hidden)
        return NextResponse.json(method)
    } catch (error) {
        console.error('Error toggling method visibility:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
