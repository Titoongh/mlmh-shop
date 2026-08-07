import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { timingSafeEqual } from 'node:crypto'

const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
// /dashboard redirige vers /admin mais reste protégé (pas de fuite d'info).
const isAdminPage = createRouteMatcher(['/dashboard', '/admin(.*)'])
const isUserPage = createRouteMatcher(['/user/:path*'])
const isApiRoute = createRouteMatcher(['/api/:path*'])

// Programmatic admin access for the local upload tool. A valid `x-admin-api-key`
// header on an admin *API* route bypasses the Clerk `org:admin` check. Fails
// closed: if ADMIN_API_KEY is unset, no key can ever match.
function hasValidAdminApiKey(req: Request): boolean {
    const expected = process.env.ADMIN_API_KEY
    const provided = req.headers.get('x-admin-api-key')
    if (!expected || !provided) return false
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

export default clerkMiddleware(async (auth, req) => {
    try {
        if (isAdminRoute(req) && hasValidAdminApiKey(req)) {
            return NextResponse.next()
        }

        const { has } = await auth()

        if (isAdminRoute(req) || isAdminPage(req)) {
            if (!has({ role: 'org:admin' })) {
                // API : 401 JSON explicite (CLI/outillage) ; pages : redirect home.
                if (isAdminRoute(req)) {
                    return NextResponse.json(
                        { error: 'Unauthorized access' },
                        { status: 401 },
                    )
                }
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
