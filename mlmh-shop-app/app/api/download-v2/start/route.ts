import { NextRequest, NextResponse, after } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomUUID } from 'node:crypto'
import {
    verifyUserPurchase,
    verifyUserMethodOfferPurchase,
} from '@/services/purchase-verification'
import { prisma } from '@/app/prisma'
import { buildDownloadZip, computeTotalBytes } from '@/lib/download/build-zip'
import { createJob, updateJobProgress, completeJob, failJob } from '@/lib/download/job-store'

/**
 * Starts a background zip-build job for an authenticated user download and
 * returns immediately with a jobId — paired with /progress and /result so
 * the client can show real progress instead of a stuck spinner on large
 * method downloads. Guest/session-link downloads keep using the plain
 * /api/download-v2 route (no client JS drives those).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const tablatureIds =
        searchParams.get('tablature_ids')?.split(',').filter(Boolean) ?? []
    const methodOfferIds =
        searchParams.get('method_offer_ids')?.split(',').filter(Boolean) ?? []

    if (tablatureIds.length === 0 && methodOfferIds.length === 0) {
        return NextResponse.json(
            { error: 'tablature_ids or method_offer_ids is required' },
            { status: 400 },
        )
    }

    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json(
            { error: 'Authentication required for user downloads' },
            { status: 401 },
        )
    }

    try {
        let authorizedTablatureIds: string[] = []
        let authorizedMethodOfferIds: string[] = []

        if (tablatureIds.length > 0) {
            const verification = await verifyUserPurchase(tablatureIds)
            if (verification.status === 'ERROR') {
                return NextResponse.json(
                    { error: verification.error || 'Error verifying purchase' },
                    { status: 500 },
                )
            }
            if (!verification.hasPurchased) {
                return NextResponse.json(
                    { error: 'You have not purchased these tablatures' },
                    { status: 403 },
                )
            }
            authorizedTablatureIds = tablatureIds
        }

        if (methodOfferIds.length > 0) {
            const verification = await verifyUserMethodOfferPurchase(methodOfferIds)
            if (verification.status === 'ERROR') {
                return NextResponse.json(
                    { error: verification.error || 'Error verifying purchase' },
                    { status: 500 },
                )
            }
            if (!verification.hasPurchased) {
                return NextResponse.json(
                    { error: 'You have not purchased these method offers' },
                    { status: 403 },
                )
            }
            authorizedMethodOfferIds = methodOfferIds
        }

        const tablatures =
            authorizedTablatureIds.length > 0
                ? await prisma.tablature.findMany({
                      where: { id: { in: authorizedTablatureIds } },
                      include: { files: true, artists: true },
                  })
                : []

        const offers =
            authorizedMethodOfferIds.length > 0
                ? await prisma.methodOffer.findMany({
                      where: { id: { in: authorizedMethodOfferIds } },
                      include: {
                          lesson: true,
                          method: {
                              include: { files: { include: { lesson: true } } },
                          },
                      },
                  })
                : []

        if (tablatures.length === 0 && offers.length === 0) {
            return NextResponse.json({ error: 'No items found' }, { status: 404 })
        }

        const jobId = randomUUID()
        const totalBytes = computeTotalBytes(tablatures, offers)
        createJob(jobId, userId, totalBytes)

        console.log(
            `[download-v2] job ${jobId} started: ${tablatures.length} tablatures, ${offers.length} method offers, ${totalBytes ?? 'unknown'} bytes`,
        )

        // Runs once this response has been sent — the client gets its jobId
        // immediately and starts polling /progress while this builds.
        after(async () => {
            try {
                const { zipBuffer, filename, cacheWrite } =
                    await buildDownloadZip({
                        tablatures,
                        offers,
                        downloadType: 'user',
                        onProgress: bytesDone =>
                            updateJobProgress(jobId, bytesDone),
                    })
                completeJob(jobId, filename, zipBuffer)
                console.log(`[download-v2] job ${jobId} ready: ${filename}`)

                // Already running in the background here, no need for a
                // second after() — just run it inline.
                if (cacheWrite) await cacheWrite()
            } catch (err) {
                console.error(`[download-v2] job ${jobId} failed:`, err)
                failJob(
                    jobId,
                    err instanceof Error ? err.message : 'Unknown error',
                )
            }
        })

        return NextResponse.json({ jobId, totalBytes })
    } catch (error: any) {
        console.error('Download start error:', error)
        return NextResponse.json(
            { error: 'Failed to start download' },
            { status: 500 },
        )
    }
}
