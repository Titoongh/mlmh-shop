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
        // Remove the dl parameter and any URL encoding
        const cleanUrl = decodeURIComponent(url.split('?')[0])
        // Get the last part of the path which contains the filename
        const fullFilename = cleanUrl.split('/').pop() || ''

        // Split filename and extension
        const lastDotIndex = fullFilename.lastIndexOf('.')
        if (lastDotIndex === -1) {
            return {
                filename: fullFilename,
                extension: '.gp5', // Default extension if none found
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
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status !== 'paid') {
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 403 },
            )
        }

        const line_items = await stripe.checkout.sessions.listLineItems(
            session.id,
            {
                expand: ['data.price.product'],
            },
        )

        // Get the first product's tablature ID from metadata
        // get product data from session
        const productsIds = line_items?.data.map(
            (item: any) => item.price.product.metadata.tabId,
        )

        console.log('products ids', productsIds)
        // Fetch tablature details from database
        const tablatures = await prisma.tablature.findMany({
            where: {
                id: { in: productsIds },
            },
        })

        const zip = new JSZip()

        // Download and add each tablature to the ZIP
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
        // // Convert Dropbox sharing link to direct download link
        // const directLink = tablature.downloadLink.replace('?dl=0', '?dl=1')

        // const response = await fetch(directLink)
        // const fileBuffer = await response.arrayBuffer()

        // // Get the content type from the response headers or detect from filename
        // const contentType =
        //     response.headers.get('content-type') ||
        //     getContentType(tablature.downloadLink)

        // // Get appropriate file extension based on content type
        // const extension = getFileExtension(contentType)
        // const filename = `${tablature.title.replace(/[^a-zA-Z0-9.-]/g, '')}${extension}`

        // return new NextResponse(fileBuffer, {
        //     headers: {
        //         'Content-Disposition': `attachment; filename="${filename}"`,
        //         'Content-Type': contentType,
        //     },
        // })
    } catch (error: any) {
        console.error('Download error:', error)
        return NextResponse.json(
            { error: 'An error occurred while processing your download' },
            { status: 500 },
        )
    }
}

function getContentType(url: string): string {
    const extension = url.toLowerCase().split('.').pop()?.split('?')[0]
    console.log('extension 1', extension)
    switch (extension) {
        case 'pdf':
            return 'application/pdf'
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'png':
            return 'image/png'
        case 'gif':
            return 'image/gif'
        default:
            return 'application/octet-stream'
    }
}

function getFileExtension(contentType: string): string {
    console.log('content type 2', contentType)
    switch (contentType) {
        case 'application/pdf':
            return '.pdf'
        case 'image/jpeg':
            return '.jpg'
        case 'image/png':
            return '.png'
        case 'image/gif':
            return '.gif'
        default:
            return ''
    }
}
