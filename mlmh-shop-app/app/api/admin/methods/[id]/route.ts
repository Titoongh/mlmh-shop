import { NextResponse } from 'next/server'
import { deleteMethod, getMethod, updateMethod } from '@/lib/admin/methods'
import { adminErrorMessage, adminErrorStatus } from '@/lib/admin/errors'

export const dynamic = 'force-dynamic'

export const GET = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const method = await getMethod(params.id)
        if (!method) {
            return NextResponse.json(
                { error: 'Méthode introuvable' },
                { status: 404 },
            )
        }
        return NextResponse.json(method)
    } catch (error) {
        console.error('Error fetching method:', error)
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
        const method = await updateMethod(params.id, body)
        return NextResponse.json(method)
    } catch (error) {
        console.error('Error updating method:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}

// Suppression définitive — outillage/API uniquement, l'UI admin n'expose que
// le masquage (`hidden`). Échoue (FK Restrict) si des ventes référencent une
// offre de la méthode : c'est voulu.
export const DELETE = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params
    try {
        const method = await deleteMethod(params.id)
        return NextResponse.json(method)
    } catch (error) {
        console.error('Error deleting method:', error)
        return NextResponse.json(
            { error: adminErrorMessage(error) },
            { status: adminErrorStatus(error) },
        )
    }
}
