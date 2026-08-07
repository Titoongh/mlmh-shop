import { NextResponse } from 'next/server'
import { createArtist, listArtists } from '@/lib/admin/artists'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')
        const hiddenParam = searchParams.get('hidden')
        const artists = await listArtists({
            ...(q ? { q } : {}),
            ...(hiddenParam !== null
                ? { hidden: hiddenParam === 'true' }
                : {}),
        })
        return NextResponse.json(artists)
    } catch (error) {
        console.error('Error listing artists:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

export const POST = async (request: Request) => {
    try {
        const body = await request.json()
        const artist = await createArtist(body)
        return NextResponse.json(artist)
    } catch (error) {
        console.error('Error creating artist:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
