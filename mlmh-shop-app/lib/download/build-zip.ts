import JSZip from 'jszip'
import type { Prisma } from '@prisma/client'
import ScalewayService from '@/services/scalewayv2'
import { filesForOffer } from '@/lib/methods/delivery'

const SCALEWAY_TABLATURES_BUCKET =
    process.env.SCALEWAY_TABLATURES_BUCKET || 'tablatures-dev'

const safeName = (name: string) =>
    name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')

export type TablatureForZip = Prisma.TablatureGetPayload<{
    include: { files: true; artists: true }
}>

export type MethodOfferForZip = Prisma.MethodOfferGetPayload<{
    include: {
        lesson: true
        method: { include: { files: { include: { lesson: true } } } }
    }
}>

export class DownloadZipError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.status = status
    }
}

// Sum of the underlying files' own sizes — used as the expected total byte
// count for progress, whether we end up serving a cached single zip or
// building one live from N files: it's the same content either way. `null`
// means "unknown" (a file is missing its size) — callers fall back to an
// indeterminate progress UI.
export function computeTotalBytes(
    tablatures: TablatureForZip[],
    offers: MethodOfferForZip[],
): number | null {
    const sizes: Array<number | null> = []
    for (const tablature of tablatures) {
        for (const file of tablature.files) sizes.push(file.fileSize)
    }
    for (const offer of offers) {
        const delivered = filesForOffer(offer, offer.method.files)
        for (const file of delivered) sizes.push(file.fileSize)
    }
    if (sizes.some(size => size === null || size === undefined)) return null
    return sizes.reduce((sum: number, size) => sum + (size as number), 0)
}

// Fetches a URL while reporting bytes as they arrive (not just once the
// whole body is buffered) — the only way to show real progress when there's
// a single big file to fetch (e.g. serving straight from the zip cache).
async function fetchBufferWithProgress(
    url: string,
    onBytes: (bytesReceived: number) => void,
): Promise<ArrayBuffer> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`)
    }
    if (!response.body) {
        const buffer = await response.arrayBuffer()
        onBytes(buffer.byteLength)
        return buffer
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
            chunks.push(value)
            total += value.length
            onBytes(value.length)
        }
    }
    const merged = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.length
    }
    return merged.buffer
}

export interface BuildZipParams {
    tablatures: TablatureForZip[]
    offers: MethodOfferForZip[]
    downloadType: 'session' | 'user'
    // Called with cumulative bytes fetched so far, and the (possibly
    // unknown) expected total — as many times as there are progress ticks.
    onProgress?: (bytesDone: number, totalBytes: number | null) => void
}

export interface BuildZipResult {
    zipBuffer: ArrayBuffer
    filename: string
    // Present only for a single-offer cache MISS: upload the freshly built
    // zip to the cache so the next download of this exact offer version can
    // skip straight to serving it. Callers decide when to run this — via
    // `after()` if they're still in the main request path, or inline if
    // they're already running in a background context.
    cacheWrite?: (() => Promise<void>) | undefined
}

/**
 * Fetches every file for the given tablatures/offers, zips them with the
 * same folder layout regardless of caller, and returns the result. Shared by
 * the synchronous /api/download-v2 route (legacy session links) and the
 * job-based /api/download-v2/start flow (progress-polled user downloads).
 */
export async function buildDownloadZip(
    params: BuildZipParams,
): Promise<BuildZipResult> {
    const { tablatures, offers, downloadType, onProgress } = params

    const scalewayService = new ScalewayService(
        undefined,
        SCALEWAY_TABLATURES_BUCKET,
    )

    // Filename: method offers of different kinds (FULL/DOCUMENTS/LESSON)
    // deliver very different content, so it must include the offer's own
    // title (e.g. "Complete package" / "Lesson: Guitar Rag"), never just the
    // method title, or the user can't tell two downloaded zips apart.
    let zipFilename: string
    if (downloadType === 'session') {
        zipFilename = offers.length > 0 ? 'purchase.zip' : 'tablatures.zip'
    } else if (tablatures.length === 1 && offers.length === 0) {
        zipFilename = `${safeName(tablatures[0].title)}.zip`
    } else if (tablatures.length === 0 && offers.length === 1) {
        zipFilename = `${safeName(offers[0].method.title)}-${safeName(offers[0].title)}.zip`
    } else if (offers.length === 0) {
        zipFilename = `tablatures-${tablatures.length}-items.zip`
    } else if (tablatures.length === 0) {
        const sameMethod = offers.every(o => o.methodId === offers[0].methodId)
        zipFilename = sameMethod
            ? `${safeName(offers[0].method.title)}-${offers.length}-offers.zip`
            : `methods-${offers.length}-offers.zip`
    } else {
        zipFilename = `purchase-${tablatures.length}-tabs-${offers.length}-methods.zip`
    }

    const totalBytes = computeTotalBytes(tablatures, offers)
    let bytesDone = 0
    const reportProgress = (chunkSize: number) => {
        bytesDone += chunkSize
        onProgress?.(bytesDone, totalBytes)
    }

    // A single method-offer download (FULL/DOCUMENTS/LESSON — by far the
    // most common case) is IDENTICAL for every buyer of that offer, and can
    // be huge (audio). Cache the built zip in Scaleway, keyed by a version
    // derived from the underlying rows' own `updatedAt` — no schema change,
    // and nothing to remember to invalidate. Mixed/multi-offer downloads
    // skip caching (rare, already small).
    const singleOfferCacheable = tablatures.length === 0 && offers.length === 1
    let methodZipCacheKey: string | null = null

    if (singleOfferCacheable) {
        const offer = offers[0]
        const deliveredFiles = filesForOffer(offer, offer.method.files)
        const versionMs = Math.max(
            offer.method.updatedAt.getTime(),
            offer.updatedAt.getTime(),
            ...deliveredFiles.map(f => f.updatedAt.getTime()),
            ...deliveredFiles.flatMap(f =>
                f.lesson ? [f.lesson.updatedAt.getTime()] : [],
            ),
        )
        methodZipCacheKey = `methods/_zip-cache/${offer.id}-${versionMs}.zip`

        const cached = await scalewayService.fileExists(
            methodZipCacheKey,
            SCALEWAY_TABLATURES_BUCKET,
        )
        if (cached) {
            const cachedSignedUrl = await scalewayService.signedUrl(
                methodZipCacheKey,
                SCALEWAY_TABLATURES_BUCKET,
                3600,
            )
            if (cachedSignedUrl) {
                try {
                    const cachedBuffer = await fetchBufferWithProgress(
                        cachedSignedUrl,
                        reportProgress,
                    )
                    console.log(
                        `Serving cached zip for offer ${offer.id}: ${methodZipCacheKey}`,
                    )
                    return { zipBuffer: cachedBuffer, filename: zipFilename }
                } catch (err) {
                    console.warn(
                        `Cache entry ${methodZipCacheKey} fetch failed, rebuilding:`,
                        err,
                    )
                    bytesDone = 0 // falling back to a full rebuild below
                }
            }
        }
    }

    const zip = new JSZip()
    let totalFilesAdded = 0

    // Server-side signed-url fetch: signed URLs are never exposed to the
    // client, the bytes are streamed straight into the zip.
    const addStorageFileToZip = async (
        folder: JSZip | null,
        file: { id: string; filename: string | null; scalewayKey: string },
    ): Promise<void> => {
        try {
            const scalewayKey = file.scalewayKey

            const fileExists = await scalewayService.fileExists(
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
            )
            if (!fileExists) {
                console.warn(`File not found in Scaleway: ${scalewayKey}`)
                return
            }

            const signedUrl = await scalewayService.signedUrl(
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
                3600,
            )
            if (!signedUrl) {
                console.warn(`Failed to generate signed URL for: ${scalewayKey}`)
                return
            }

            const fileBuffer = await fetchBufferWithProgress(
                signedUrl,
                reportProgress,
            )

            const safeFilename = file.filename || `file-${file.id}`
            folder?.file(safeFilename, fileBuffer)
            totalFilesAdded++

            console.log(`Added file to ZIP: ${safeFilename} from ${scalewayKey}`)
        } catch (fileError) {
            console.error(`Error processing file ${file.scalewayKey}:`, fileError)
        }
    }

    // Build the full (folder, file) task list first — folder structure is
    // cheap sync JSZip bookkeeping — then fetch every file's bytes.
    // Sequential on purpose: these can be large audio files, so the
    // bottleneck is the user's bandwidth, not per-file round-trip latency —
    // fetching several at once just contends for the same pipe instead of
    // finishing faster.
    const fileTasks: Array<{
        folder: JSZip | null
        file: { id: string; filename: string | null; scalewayKey: string }
    }> = []

    for (const tablature of tablatures) {
        const tablatureFolder = zip.folder(safeName(tablature.title))
        if (tablature.files && tablature.files.length > 0) {
            for (const file of tablature.files) {
                fileTasks.push({ folder: tablatureFolder, file })
            }
        }
    }

    for (const offer of offers) {
        const deliveredFiles = filesForOffer(offer, offer.method.files)

        if (offer.kind === 'LESSON') {
            const lessonFolder = zip.folder(
                `${safeName(offer.method.title)}-${safeName(offer.lesson?.title || 'lesson')}`,
            )
            for (const file of deliveredFiles) {
                fileTasks.push({ folder: lessonFolder, file })
            }
        } else {
            const methodFolder = zip.folder(safeName(offer.method.title))
            for (const file of deliveredFiles) {
                const targetFolder = file.lesson
                    ? methodFolder?.folder(
                          `${file.lesson.rank}-${safeName(file.lesson.title)}`,
                      ) ?? null
                    : methodFolder
                fileTasks.push({ folder: targetFolder, file })
            }
        }
    }

    for (const task of fileTasks) {
        await addStorageFileToZip(task.folder, task.file)
    }

    if (totalFilesAdded === 0) {
        throw new DownloadZipError('No files available for download', 404)
    }

    console.log(`Successfully added ${totalFilesAdded} files to ZIP`)

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
    onProgress?.(totalBytes ?? bytesDone, totalBytes)

    let cacheWrite: (() => Promise<void>) | undefined
    if (singleOfferCacheable && methodZipCacheKey) {
        const cacheKey = methodZipCacheKey
        cacheWrite = async () => {
            try {
                await scalewayService.uploadFile(
                    Buffer.from(zipBuffer),
                    cacheKey,
                    SCALEWAY_TABLATURES_BUCKET,
                    'application/zip',
                )
                console.log(`Cached zip at ${cacheKey}`)
            } catch (cacheError) {
                console.error(
                    `Failed to write zip cache ${cacheKey}:`,
                    cacheError,
                )
            }
        }
    }

    return { zipBuffer, filename: zipFilename, cacheWrite }
}
