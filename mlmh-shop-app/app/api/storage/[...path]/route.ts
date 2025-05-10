import { NextRequest, NextResponse } from 'next/server'
import ScalewayService from '@/services/scalewayv2'

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
    const fullPath = params.path.join('/')

    try {
        const scalewayService = new ScalewayService()

        const fileExists = await scalewayService.fileExists(fullPath)
        if (!fileExists) {
            return new NextResponse('File not found', { status: 404 })
        }

        const signedUrl = await scalewayService.signedUrl(fullPath)

        return new NextResponse(signedUrl)
    } catch (error) {
        console.error('Storage proxy error:', error)
        return new NextResponse('Error fetching content', { status: 500 })
    }
}
