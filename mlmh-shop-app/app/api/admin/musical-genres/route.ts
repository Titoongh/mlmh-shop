import { NextResponse } from 'next/server'
import { createGenre, listGenres } from '@/lib/admin/genres'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const GET = async () => {
    try {
        const genres = await listGenres()
        return NextResponse.json(genres)
    } catch (error) {
        console.error('Error listing genres:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

export const POST = async (request: Request) => {
    try {
        const body = await request.json()
        const genre = await createGenre(body)
        return NextResponse.json(genre)
    } catch (error) {
        console.error('Error creating genre:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
