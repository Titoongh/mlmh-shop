import { NextResponse } from 'next/server'
import { deleteGenre, updateGenre } from '@/lib/admin/genres'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const PUT = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const body = await request.json()
        const genre = await updateGenre(params.id, body)
        return NextResponse.json(genre)
    } catch (error) {
        console.error('Error updating genre:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

// Supprimer un genre ne fait que délier ses artistes/tablatures (relation
// many-to-many implicite) — aucune donnée de vente n'y est rattachée.
export const DELETE = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const genre = await deleteGenre(params.id)
        return NextResponse.json(genre)
    } catch (error) {
        console.error('Error deleting genre:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
