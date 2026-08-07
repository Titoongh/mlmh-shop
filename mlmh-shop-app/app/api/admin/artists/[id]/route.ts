import { NextResponse } from 'next/server'
import { deleteArtist, getArtist, updateArtist } from '@/lib/admin/artists'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const GET = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const artist = await getArtist(params.id)
        if (!artist) {
            return NextResponse.json(
                { error: 'Artiste introuvable' },
                { status: 404 },
            )
        }
        return NextResponse.json(artist)
    } catch (error) {
        console.error('Error fetching artist:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

export const PUT = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const body = await request.json()
        const artist = await updateArtist(params.id, body)
        return NextResponse.json(artist)
    } catch (error) {
        console.error('Error updating artist:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

// Suppression définitive — outillage/API uniquement, l'UI admin n'expose que
// le masquage (`hidden`).
export const DELETE = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const artist = await deleteArtist(params.id)
        return NextResponse.json(artist)
    } catch (error) {
        console.error('Error deleting artist:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
