import { NextRequest, NextResponse } from 'next/server'
import ScalewayService from '@/services/scalewayv2'

export const dynamic = 'force-dynamic'

export const POST = async (request: NextRequest) => {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 },
            )
        }

        const storageService = new ScalewayService(
            undefined,
            process.env.SCW_BUCKET_NAME,
        )

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
        const filename = `${uniqueSuffix}-${sanitizedName}`

        const key = `${filename}`

        await storageService.uploadFile(
            buffer,
            key,
            process.env.SCW_BUCKET_NAME,
            file.type || 'application/octet-stream',
        )

        // Construct the public URL
        const url = `/public/storage/${key}`

        // Return the URL and additional file info
        return NextResponse.json({
            url,
            key,
            filename: sanitizedName,
            contentType: file.type,
        })
    } catch (error) {
        console.error('Upload failed:', error)
        return NextResponse.json(
            {
                error: 'Upload failed',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        )
    }
}
