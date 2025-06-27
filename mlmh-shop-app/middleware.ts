// import { NextResponse } from 'next/server'
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
// const isAdminPage = createRouteMatcher(['/dashboard'])
// const isApiRoute = createRouteMatcher(['/api/:path*'])

// export default clerkMiddleware(async (auth, req) => {
//     console.log('🔍 Middleware called for:', req.url)

//     try {
//         if (isAdminRoute(req)) {
//             console.log('🛡️ Protecting admin route:', req.url)

//             // Test basic auth first
//             const authData = await auth()
//             console.log('📊 Auth data:', {
//                 userId: authData.userId,
//                 sessionId: authData.sessionId,
//                 orgId: authData.orgId,
//                 orgRole: authData.orgRole,
//                 orgSlug: authData.orgSlug,
//             })

//             if (!authData.userId) {
//                 console.log('❌ No user ID found')
//                 throw new Error('User not authenticated')
//             }

//             console.log('✅ User authenticated successfully')

//             // Check if user is authorized for admin access
//             const allowedAdminUsers = [
//                 'user_2sVLYOCosyo2DCPU5KPQ23wUrrx', // Votre user ID
//                 'user_2sSBtR6BHezOE1o6plcza7rOltN',
//                 // Ajoutez d'autres user IDs ici si besoin
//             ]

//             if (!allowedAdminUsers.includes(authData.userId)) {
//                 console.log('❌ User not authorized for admin access')
//                 throw new Error('User not authorized for admin access')
//             }

//             console.log('✅ User authorized for admin access')
//         }

//         return NextResponse.next()
//     } catch (error) {
//         console.error('❌ Middleware error:', error)
//         console.error('📋 Error details:', {
//             name: error instanceof Error ? error.name : 'Unknown',
//             message: error instanceof Error ? error.message : 'Unknown error',
//             digest: (error as any)?.digest,
//             url: req.url,
//             headers: Object.fromEntries(req.headers.entries()),
//         })

//         // For API routes, return JSON error
//         if (isApiRoute(req)) {
//             return NextResponse.json(
//                 {
//                     error: 'Unauthorized access',
//                     details:
//                         error instanceof Error
//                             ? error.message
//                             : 'Authentication required',
//                 },
//                 { status: 401 },
//             )
//         }

//         // For non-API routes, let it proceed to show the error page
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
import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/api/admin/:path*'])
const isAdminPage = createRouteMatcher(['/dashboard'])
const isApiRoute = createRouteMatcher(['/api/:path*'])

export default clerkMiddleware(async (auth, req) => {
    try {
        if (isAdminRoute(req)) {
            await auth.protect(has => {
                return has({ role: 'org:admin' })
            })
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Middleware error:', error)
        // Return JSON error instead of letting it fall through to HTML error page
        if (isApiRoute(req)) {
            return NextResponse.json(
                {
                    error: `Unauthorized access: ${error}`,
                },
                { status: 401 },
            )
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
