import { NextResponse } from 'next/server'
import {
    deleteTablature,
    getTablature,
    updateTablature,
} from '@/lib/admin/tablatures'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const GET = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const tablature = await getTablature(params.id)
        if (!tablature) {
            return NextResponse.json(
                { error: 'Tablature introuvable' },
                { status: 404 },
            )
        }
        return NextResponse.json(tablature)
    } catch (error) {
        console.error('Error fetching tablature:', error)
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
        const tablature = await updateTablature(params.id, body)
        return NextResponse.json(tablature)
    } catch (error) {
        console.error('Error updating tablature:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

// Suppression définitive — outillage/API uniquement, l'UI admin n'expose que
// le masquage (`hidden`). Échoue (FK) si des ventes y sont liées : c'est voulu.
export const DELETE = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const tablature = await deleteTablature(params.id)
        return NextResponse.json(tablature)
    } catch (error) {
        console.error('Error deleting tablature:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
