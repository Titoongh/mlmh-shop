import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/app/prisma'
import JSZip from 'jszip'
import ScalewayService from '../../../services/scalewayv2'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const SCALEWAY_TABLATURES_BUCKET =
    process.env.SCALEWAY_TABLATURES_BUCKET || 'tablatures-dev'

function getFilenameFromScalewayKey(scalewayKey: string): {
    filename: string
    extension: string
} {
    try {
        const fullFilename = scalewayKey.split('/').pop() || ''
        const lastDotIndex = fullFilename.lastIndexOf('.')

        if (lastDotIndex === -1) {
            return {
                filename: fullFilename || 'tablature',
                extension: '.pdf',
            }
        }

        return {
            filename: fullFilename.substring(0, lastDotIndex),
            extension: fullFilename.substring(lastDotIndex),
        }
    } catch (error) {
        console.error('Error parsing Scaleway key:', error)
        return {
            filename: 'tablature',
            extension: '.pdf',
        }
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing session ID' },
            { status: 400 },
        )
    }

    try {
        const downloadIntent = await prisma.downloadIntent.findUnique({
            where: { stripeSessionId: sessionId },
            include: {
                downloads: {
                    include: {
                        tablature: true,
                    },
                },
            },
        })

        if (!downloadIntent) {
            return NextResponse.json(
                { error: 'Invalid session ID' },
                { status: 404 },
            )
        }

        if (downloadIntent.success === false) {
            return NextResponse.json(
                { error: 'Payment was not succesfull' },
                { status: 403 },
            )
        }

        if (
            downloadIntent.success === null ||
            downloadIntent.success === undefined
        ) {
            const session = await stripe.checkout.sessions.retrieve(sessionId)
            if (session.payment_status !== 'paid') {
                return NextResponse.json(
                    { error: 'Payment not completed' },
                    { status: 403 },
                )
            }
        }

        const tablatures = downloadIntent.downloads.map(
            download => download.tablature,
        )

        const zip = new JSZip()
        const scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )

        let index = 0
        for (const tablature of tablatures) {
            console.log(`Processing Scaleway key: ${tablature.downloadLink}`)
            const scalewayKey = tablature.downloadLink

            // Check if file exists in Scaleway
            const fileExists = await scalewayService.fileExists(
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
            )
            if (!fileExists) {
                throw new Error(`File not found in Scaleway: ${scalewayKey}`)
            }

            // Get signed URL and download file
            const signedUrl = await scalewayService.signedUrl(
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
                3600,
            )
            const response = await fetch(signedUrl)
            if (!response.ok) {
                throw new Error(
                    `Failed to download from Scaleway: ${response.status}`,
                )
            }
            const fileBuffer = await response.arrayBuffer()

            const { filename, extension } =
                getFilenameFromScalewayKey(scalewayKey)
            const safeFilename = `${filename.replace(
                /[^a-zA-Z0-9.-]/g,
                '',
            )}-${index}${extension}`

            zip.file(safeFilename, fileBuffer)
            index += 1
        }

        // Generate the ZIP file
        const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

        // Return the ZIP file
        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Disposition': 'attachment; filename="tablatures.zip"',
                'Content-Type': 'application/zip',
            },
        })
    } catch (error: any) {
        console.error('Download error:', error)
        return NextResponse.json(
            { error: 'An error occurred while processing your download' },
            { status: 500 },
        )
    }
}
