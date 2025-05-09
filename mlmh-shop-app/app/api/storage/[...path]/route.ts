import { NextRequest, NextResponse } from 'next/server'
import ScalewayService from '@/services/scalewayv2'

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
    console.log('full Path', params.path)
    // Reconstruct the full path from the path segments
    const fullPath = params.path.join('/')

    try {
        // Initialize the Scaleway service with your existing configuration
        const scalewayService = new ScalewayService()

        // Check if file exists first
        const fileExists = await scalewayService.fileExists(fullPath)
        if (!fileExists) {
            return new NextResponse('File not found', { status: 404 })
        }

        const signedUrl = await scalewayService.signedUrl(fullPath)

        // Return the file with appropriate headers
        console.log('Serving file from Scaleway:', signedUrl)
        // return NextResponse.redirect(url)
        return new NextResponse(signedUrl)
        // return NextResponse.redirect(signedUrl)

        // return new NextResponse(file.content, {
        //     status: 200,
        //     headers: {
        //         'Content-Type': contentType,
        //         'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        //         'Content-Length': responseBody.length.toString(),
        //     },
        // })
    } catch (error) {
        console.error('Storage proxy error:', error)
        return new NextResponse('Error fetching content', { status: 500 })
    }
}

// Simple helper function to determine content type based on file extension
function getContentTypeFromPath(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase() || ''

    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        pdf: 'application/pdf',
    }

    return mimeTypes[extension] || 'application/octet-stream'
}
