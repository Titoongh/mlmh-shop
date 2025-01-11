import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
