import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Check if current request is for API or Admin routes
    const isApiRoute = request.nextUrl.pathname.startsWith('/api')
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
    const isAdminLoginPage = request.nextUrl.pathname.startsWith('/admin')

    // Handle admin route protection
    if (isAdminPage && !isAdminLoginPage) {
        const authCookie = request.cookies.get('admin_token')
        if (!authCookie) {
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
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//     const response = NextResponse.next()

//     const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
//     console.log('isAdminPage', isAdminPage)
//     const authCookie = request.cookies.get('admin_token')

//     if (isAdminPage && !authCookie) {
//         return NextResponse.redirect(new URL('/admin/login', request.url))
//     }

//     // Add CORS headers
//     response.headers.set('Access-Control-Allow-Origin', '*')
//     response.headers.set(
//         'Access-Control-Allow-Methods',
//         'GET, POST, PUT, DELETE, OPTIONS',
//     )
//     response.headers.set(
//         'Access-Control-Allow-Headers',
//         'Content-Type, Authorization',
//     )

//     // Handle OPTIONS request
//     if (request.method === 'OPTIONS') {
//         return new NextResponse(null, {
//             status: 200,
//             headers: response.headers,
//         })
//     }

//     return response
// }

// export const config = {
//     matcher: '/api/:path*',
// }
