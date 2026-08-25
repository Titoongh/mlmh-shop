import { NextRequest, NextResponse, after } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    canDownloadSession,
    verifyUserPurchase,
    verifyUserMethodOfferPurchase,
} from '@/services/purchase-verification'
import { prisma } from '@/app/prisma'
import { buildDownloadZip, DownloadZipError } from '@/lib/download/build-zip'

/**
 * Robust download endpoint that supports both:
 * 1. Session-based downloads (legacy DownloadIntent system, e.g. email links)
 * 2. User-based downloads (authenticated system) — kept for direct/back-compat
 *    use; the in-app download button uses the job-based /start,/progress,
 *    /result routes instead so it can show real progress on large methods.
 * Items: tablatures (tablature_ids) and/or method offers (method_offer_ids).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const tablatureIds = searchParams.get('tablature_ids')?.split(',')
    const methodOfferIds = searchParams.get('method_offer_ids')?.split(',')

    try {
        let authorizedTablatureIds: string[] = []
        let authorizedMethodOfferIds: string[] = []
        let downloadType: 'session' | 'user' = 'session'

        if (sessionId) {
            // Legacy session-based download
            console.log('Processing session-based download:', sessionId)

            const downloadPermission = await canDownloadSession(sessionId)
            if (!downloadPermission.canDownload) {
                return NextResponse.json(
                    { error: downloadPermission.reason || 'Download not authorized' },
                    { status: 403 }
                )
            }

            authorizedTablatureIds = downloadPermission.tablatureIds || []
            authorizedMethodOfferIds = downloadPermission.methodOfferIds || []
        } else if (
            (tablatureIds && tablatureIds.length > 0) ||
            (methodOfferIds && methodOfferIds.length > 0)
        ) {
            // New user-based download with authentication
            console.log(
                'Processing user-based download:',
                { tablatureIds, methodOfferIds },
            )
            downloadType = 'user'

            const { userId } = await auth()
            if (!userId) {
                return NextResponse.json(
                    { error: 'Authentication required for user downloads' },
                    { status: 401 }
                )
            }

            if (tablatureIds && tablatureIds.length > 0) {
                const verification = await verifyUserPurchase(tablatureIds)
                if (verification.status === 'ERROR') {
                    return NextResponse.json(
                        { error: verification.error || 'Error verifying purchase' },
                        { status: 500 }
                    )
                }

                if (!verification.hasPurchased) {
                    return NextResponse.json(
                        { error: 'You have not purchased these tablatures' },
                        { status: 403 }
                    )
                }

                authorizedTablatureIds = tablatureIds
            }

            if (methodOfferIds && methodOfferIds.length > 0) {
                const verification =
                    await verifyUserMethodOfferPurchase(methodOfferIds)
                if (verification.status === 'ERROR') {
                    return NextResponse.json(
                        { error: verification.error || 'Error verifying purchase' },
                        { status: 500 }
                    )
                }

                if (!verification.hasPurchased) {
                    return NextResponse.json(
                        { error: 'You have not purchased these method offers' },
                        { status: 403 }
                    )
                }

                authorizedMethodOfferIds = methodOfferIds
            }
        } else {
            return NextResponse.json(
                { error: 'Either session_id, tablature_ids or method_offer_ids parameter is required' },
                { status: 400 }
            )
        }

        if (
            authorizedTablatureIds.length === 0 &&
            authorizedMethodOfferIds.length === 0
        ) {
            return NextResponse.json(
                { error: 'No items found for download' },
                { status: 404 }
            )
        }

        // Get tablature data with files
        const tablatures =
            authorizedTablatureIds.length > 0
                ? await prisma.tablature.findMany({
                      where: {
                          id: { in: authorizedTablatureIds },
                      },
                      include: {
                          files: true,
                          artists: true,
                      },
                  })
                : []

        // Get method offer data with the whole method's files: the delivered
        // subset is derived per offer by filesForOffer().
        const offers =
            authorizedMethodOfferIds.length > 0
                ? await prisma.methodOffer.findMany({
                      where: {
                          id: { in: authorizedMethodOfferIds },
                      },
                      include: {
                          lesson: true,
                          method: {
                              include: {
                                  files: { include: { lesson: true } },
                              },
                          },
                      },
                  })
                : []

        if (tablatures.length === 0 && offers.length === 0) {
            return NextResponse.json(
                { error: 'No items found' },
                { status: 404 }
            )
        }

        console.log(`Preparing download for ${tablatures.length} tablatures and ${offers.length} method offers (${downloadType} download)`)

        const { zipBuffer, filename, cacheWrite } = await buildDownloadZip({
            tablatures,
            offers,
            downloadType,
        })

        // Still in the main request path here (unlike the job-based /start
        // route) — defer the cache upload past the response via after() so
        // it never delays this download.
        if (cacheWrite) after(cacheWrite)

        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/zip',
                'Content-Length': zipBuffer.byteLength.toString(),
            },
        })

    } catch (error: any) {
        if (error instanceof DownloadZipError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status },
            )
        }

        console.error('Download error:', error)

        if (error.message?.includes('Authentication')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            {
                error: 'An error occurred while processing your download',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}
