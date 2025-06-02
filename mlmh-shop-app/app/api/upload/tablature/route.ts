import { NextRequest, NextResponse } from 'next/server'
import ScalewayService from '../../../../services/scalewayv2'

const SCALEWAY_TABLATURES_BUCKET =
    process.env.SCALEWAY_TABLATURES_BUCKET || 'tablatures-dev'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const title = formData.get('title') as string
        const tablatureId = formData.get('tablatureId') as string

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 },
            )
        }

        if (!title) {
            return NextResponse.json(
                { error: 'No title provided' },
                { status: 400 },
            )
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        const allowedExtensions = ['pdf']

        if (!allowedExtensions.includes(fileExtension || '')) {
            return NextResponse.json(
                {
                    error: `File type not allowed. Allowed types: ${allowedExtensions.join(
                        ', ',
                    )}`,
                },
                { status: 400 },
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Generate Scaleway key
        const safeTitle = title
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()

        const shortId = tablatureId
            ? tablatureId.slice(0, 8)
            : Math.random().toString(36).substr(2, 8)
        const scalewayKey = `${safeTitle}-${shortId}.${fileExtension}`

        // Upload to Scaleway
        const scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )

        await scalewayService.uploadFile(
            buffer,
            scalewayKey,
            SCALEWAY_TABLATURES_BUCKET,
            file.type || 'application/octet-stream',
        )

        console.log(`File uploaded to Scaleway: ${scalewayKey}`)

        return NextResponse.json({
            success: true,
            scalewayKey,
            originalFileName: file.name,
            fileSize: buffer.length,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 },
        )
    }
}
