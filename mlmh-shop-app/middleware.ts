import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
const isAdminPage = createRouteMatcher(['/dashboard'])
const isApiRoute = createRouteMatcher(['/api/:path*'])

export default clerkMiddleware(async (auth, req) => {
    try {
        if (isAdminRoute(req)) {
            console.log('Protecting admin route:', req.url)
            await auth.protect(has => {
                return has({ role: 'org:admin' })
            })
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Middleware error:', error)

        // For API routes, return JSON error instead of letting it fall through to 404
        if (isApiRoute(req)) {
            return NextResponse.json(
                {
                    error: 'Unauthorized access',
                    details:
                        error instanceof Error
                            ? error.message
                            : 'Authentication required',
                },
                { status: 401 },
            )
        }

        // For non-API routes, let it proceed to show the error page
        return NextResponse.next()
    }
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
