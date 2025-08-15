import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
const isAdminPage = createRouteMatcher(['/dashboard'])
const isUserPage = createRouteMatcher(['/user/:path*'])
const isApiRoute = createRouteMatcher(['/api/:path*'])

export default clerkMiddleware(async (auth, req) => {
    try {
        const { has } = await auth()

        if (isAdminRoute(req) || isAdminPage(req)) {
            if (!has({ role: 'org:admin' })) {
                return NextResponse.redirect(new URL('/', req.url))
            }
        }

        if (isUserPage(req)) {
            await auth.protect()
        }

        return NextResponse.next()
    } catch (error) {
        // Return JSON error instead of letting it fall through to HTML error page
        if (isApiRoute(req)) {
            return NextResponse.json(
                {
                    error: 'Unauthorized access',
                },
                { status: 401 },
            )
        }

        // Handling redirect errors
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        // For non-API routes, let it proceed normally
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
