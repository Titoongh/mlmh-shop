import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/app/prisma'
import JSZip from 'jszip'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

function getFilenameFromDropboxUrl(url: string): {
    filename: string
    extension: string
} {
    try {
        const cleanUrl = decodeURIComponent(url.split('?')[0])
        const fullFilename = cleanUrl.split('/').pop() || ''

        const lastDotIndex = fullFilename.lastIndexOf('.')
        if (lastDotIndex === -1) {
            return {
                filename: fullFilename,
                extension: '.gp5',
            }
        }

        return {
            filename: fullFilename.substring(0, lastDotIndex),
            extension: fullFilename.substring(lastDotIndex),
        }
    } catch (error) {
        console.error('Error parsing Dropbox URL:', error)
        return {
            filename: 'download',
            extension: '.gp5',
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

        let index = 0
        for (const tablature of tablatures) {
            const directLink = tablature.downloadLink.replace('?dl=0', '?dl=1')
            const response = await fetch(directLink)
            const fileBuffer = await response.arrayBuffer()

            const { filename, extension } = getFilenameFromDropboxUrl(
                tablature.downloadLink,
            )
            const safeFilename = `${filename.replace(/[^a-zA-Z0-9.-]/g, '')}-${index}${extension}`

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
