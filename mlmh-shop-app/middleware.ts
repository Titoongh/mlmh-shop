import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
const isAdminPage = createRouteMatcher(['/dashboard'])
const isApiRoute = createRouteMatcher(['/api/:path*'])

export default clerkMiddleware(async (auth, req) => {
    if (isAdminRoute(req) || isAdminPage(req)) {
        await auth.protect(has => {
            return (
                has({ role: 'org:back_office' }) || has({ role: 'org:admin' })
            )
        })
    }

    // If the route is an API route, attach CORS headers and handle OPTIONS requests.
    if (isApiRoute(req)) {
        const response = NextResponse.next()
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS',
        )
        response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization',
        )

        if (req.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: response.headers,
            })
        }
        return response
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Use the default Clerk recommended matcher.
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { createClerkClient } from '@clerk/backend'
// import { clerkMiddleware } from '@clerk/nextjs/server'

// export default clerkMiddleware()

// export async function middleware(request: NextRequest) {
//     const response = NextResponse.next()

//     // Check if current request is for API or Admin rimport { getApps } from 'firebase/app'outes
//     const isApiRoute = request.nextUrl.pathname.startsWith('/api')
//     const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
//     const isAdminLoginPage = request.nextUrl.pathname.startsWith('/admin/login')

//     // Handle admin route protection
//     if (isAdminPage && !isAdminLoginPage) {
//         try {
//             return NextResponse.next()
//         } catch (error) {
//             return NextResponse.redirect(new URL('/admin/login', request.url))
//         }
//     }

//     // Only apply CORS headers to API routes
//     if (isApiRoute) {
//         response.headers.set('Access-Control-Allow-Origin', '*')
//         response.headers.set(
//             'Access-Control-Allow-Methods',
//             'GET, POST, PUT, DELETE, OPTIONS',
//         )
//         response.headers.set(
//             'Access-Control-Allow-Headers',
//             'Content-Type, Authorization',
//         )
//         // Handle OPTIONS request for API routes
//         if (request.method === 'OPTIONS') {
//             return new NextResponse(null, {
//                 status: 200,
//                 headers: response.headers,
//             })
//         }
//     }

//     return response
// }

// export const config = {
//     matcher: [
//         '/admin/:path*', // Match all admin routes
//         '/api/:path*', // Match all API routes
//         // Skip Next.js internals and all static files, unless found in search params
//         '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//         // Always run for API routes
//         '/(api|trpc)(.*)',
//     ],
// }
