import { NextResponse } from 'next/server'
import { setArtistHidden } from '@/lib/admin/artists'
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
        const artist = await setArtistHidden(params.id, hidden)
        return NextResponse.json(artist)
    } catch (error) {
        console.error('Error toggling artist visibility:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
