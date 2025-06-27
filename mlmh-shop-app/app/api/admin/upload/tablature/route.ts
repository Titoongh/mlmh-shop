import { NextRequest, NextResponse } from 'next/server'
import ScalewayService from '../../../../../services/scalewayv2'

const SCALEWAY_TABLATURES_BUCKET =
    process.env.SCALEWAY_TABLATURES_BUCKET || 'tablatures-dev'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]
        const title = formData.get('title') as string
        const tablatureId = formData.get('tablatureId') as string

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 },
            )
        }

        if (!title) {
            return NextResponse.json(
                { error: 'No title provided' },
                { status: 400 },
            )
        }

        const allowedExtensions = [
            'pdf',
            'gp5',
            'gpx',
            'gp4',
            'gp3',
            'mid',
            'midi',
        ]
        const uploadResults = []

        // Upload to Scaleway
        const scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const fileExtension = file.name.split('.').pop()?.toLowerCase()

            if (!allowedExtensions.includes(fileExtension || '')) {
                return NextResponse.json(
                    {
                        error: `File type not allowed for ${
                            file.name
                        }. Allowed types: ${allowedExtensions.join(', ')}`,
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

            // Include file index for multiple files
            const fileIndex = files.length > 1 ? `-${i + 1}` : ''
            const scalewayKey = `${safeTitle}-${shortId}${fileIndex}.${fileExtension}`

            await scalewayService.uploadFile(
                buffer,
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
                file.type || 'application/octet-stream',
            )

            console.log(`File uploaded to Scaleway: ${scalewayKey}`)

            uploadResults.push({
                filename: file.name,
                scalewayKey,
                fileSize: buffer.length,
                mimeType: file.type || 'application/octet-stream',
            })
        }

        return NextResponse.json({
            success: true,
            files: uploadResults,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload files' },
            { status: 500 },
        )
    }
}
