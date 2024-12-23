import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// import { adminAuth } from '@/_lib/admin'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Check if current request is for API or Admin rimport { getApps } from 'firebase/app'outes
    const isApiRoute = request.nextUrl.pathname.startsWith('/api')
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
    const isAdminLoginPage = request.nextUrl.pathname.startsWith('/admin/login')

    // Handle admin route protection
    if (isAdminPage && !isAdminLoginPage) {
        const session = request.cookies.get('session')?.value || ''
        try {
            // Verify session
            // const decodedClaims = await adminAuth.verifySessionCookie(
            //     session,
            //     true,
            // )

            // // Check if user has admin role
            // if (decodedClaims.role !== 'admin') {
            //     return NextResponse.redirect(
            //         new URL('/admin/login', request.url),
            //     )
            // }

            return NextResponse.next()
        } catch (error) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // Only apply CORS headers to API routes
    if (isApiRoute) {
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS',
        )
        response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization',
        )
        // Handle OPTIONS request for API routes
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: response.headers,
            })
        }
    }

    return response
}

export const config = {
    matcher: [
        '/admin/:path*', // Match all admin routes
        '/api/:path*', // Match all API routes
    ],
}
