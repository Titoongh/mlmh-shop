import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/app/prisma'
import JSZip from 'jszip'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

// export async function GET(request: NextRequest) {
//     const { searchParams } = new URL(request.url)
//     const sessionId = searchParams.get('session_id')

//     if (!sessionId) {
//         return NextResponse.json(
//             { error: 'Missing session ID' },
//             { status: 400 },
//         )
//     }

//     try {
//         // Retrieve the session to check its payment status
//         const session = await stripe.checkout.sessions.retrieve(sessionId)

//         if (session.payment_status !== 'paid') {
//             return NextResponse.json(
//                 { error: 'Payment not completed' },
//                 { status: 403 },
//             )
//         }

//         const line_items = await stripe.checkout.sessions.listLineItems(
//             session.id,
//             {
//                 expand: ['data.price.product'],
//             },
//         )

//         console.log('session', session)

//         // get product data from session
//         const products = line_items?.data.map((item: any) => ({
//             item: item.price.product.metadata,
//             quantity: item.quantity,
//         }))

//         console.log('products', products)

//         // If payment is successful, serve the file
//         const filePath = path.join(process.cwd(), 'app/assets', 'tab.jpg')
//         const fileBuffer = await fs.readFile(filePath)

//         return new NextResponse(fileBuffer, {
//             headers: {
//                 'Content-Disposition': 'attachment; filename="tab.jpg"',
//                 'Content-Type': 'application/octet-stream',
//             },
//         })
//     } catch (error: any) {
//         console.error('Download error:', error)
//         return NextResponse.json(
//             { error: 'An error occurred while processing your download' },
//             { status: 500 },
//         )
//     }
// }

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
        for (const tablature of tablatures) {
            const directLink = tablature.downloadLink.replace('?dl=0', '?dl=1')
            const response = await fetch(directLink)
            const fileBuffer = await response.arrayBuffer()

            const contentType =
                response.headers.get('content-type') ||
                getContentType(tablature.downloadLink)
            const extension = getFileExtension(contentType)
            const filename = `${tablature.title.replace(/[^a-zA-Z0-9.-]/g, '')}${extension}`

            // Add the file to the ZIP
            zip.file(filename, fileBuffer)
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
