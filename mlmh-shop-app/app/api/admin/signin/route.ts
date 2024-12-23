// import { adminAuth } from '@/_lib/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json()

        // Verify the ID token first
        // const decodedToken = await adminAuth.verifyIdToken(idToken)

        // if (decodedToken.role !== 'admin') {
        //     return NextResponse.json(
        //         { error: 'Unauthorized access' },
        //         { status: 403 },
        //     )
        // }

        // Create session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        // const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        //     expiresIn,
        // })

        // Set cookie
        // cookies().set('session', sessionCookie, {
        //     maxAge: expiresIn,
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     path: '/',
        // })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
