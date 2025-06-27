import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
const isAdminPage = createRouteMatcher(['/dashboard'])
const isApiRoute = createRouteMatcher(['/api/:path*'])

export default clerkMiddleware(async (auth, req) => {
    if (isAdminRoute(req)) {
        await auth.protect(has => {
            return has({ role: 'org:admin' })
        })
    }

    // If the route is an API route, attach CORS headers and handle OPTIONS requests.
    // Set up CORS headers for API routes if needed
    // (means if you want to allow calls from other origins).
    // if (isApiRoute(req)) {
    //     const response = NextResponse.next()
    //     response.headers.set('Access-Control-Allow-Origin', '*')
    //     response.headers.set(
    //         'Access-Control-Allow-Methods',
    //         'GET, POST, PUT, DELETE, OPTIONS',
    //     )
    //     response.headers.set(
    //         'Access-Control-Allow-Headers',
    //         'Content-Type, Authorization',
    //     )

    //     if (req.method === 'OPTIONS') {
    //         return new NextResponse(null, {
    //             status: 200,
    //             headers: response.headers,
    //         })
    //     }
    //     return response
    // }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // This ensures your middleware only runs on actual pages and API routes,
        // not on static assets like images, stylesheets, or JavaScript files.
        // This improves performance by avoiding unnecessary middleware execution
        // for static content.
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
// import { NextResponse } from 'next/server'
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
// const isAdminPage = createRouteMatcher(['/dashboard'])
// const isApiRoute = createRouteMatcher(['/api/:path*'])

// export default clerkMiddleware(async (auth, req) => {
//     try {
//         if (isAdminRoute(req)) {
//             await auth.protect(has => {
//                 return has({ role: 'org:admin' })
//             })
//         }

//         return NextResponse.next()
//     } catch (error) {
//         console.error('Middleware error:', error)
//         // Return JSON error instead of letting it fall through to HTML error page
//         if (isApiRoute(req)) {
//             return NextResponse.json(
//                 {
//                     error: `Unauthorized access: ${error}`,
//                 },
//                 { status: 401 },
//             )
//         }
//         // For non-API routes, let it proceed normally
//         return NextResponse.next()
//     }
// })

// export const config = {
//     matcher: [
//         // This ensures your middleware only runs on actual pages and API routes,
//         // not on static assets like images, stylesheets, or JavaScript files.
//         // This improves performance by avoiding unnecessary middleware execution
//         // for static content.
//         '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//         '/(api|trpc)(.*)',
//     ],
// }
