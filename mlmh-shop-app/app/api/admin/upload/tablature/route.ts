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

        // Validate Scaleway configuration
        if (!process.env.SCW_ACCESS_KEY || !process.env.SCW_SECRET_KEY) {
            return NextResponse.json(
                {
                    error: 'Server configuration error: Missing storage credentials',
                },
                { status: 500 },
            )
        }

        // Upload to Scaleway
        console.log(
            'Initializing Scaleway service with bucket:',
            SCALEWAY_TABLATURES_BUCKET,
        )
        const scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const fileExtension = file.name.split('.').pop()?.toLowerCase()

            console.log(
                `Processing file ${i + 1}/${files.length}: ${file.name}`,
            )

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

            try {
                // Convert file to buffer
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                console.log(
                    `File ${file.name} converted to buffer, size: ${buffer.length} bytes`,
                )

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

                uploadResults.push({
                    filename: file.name,
                    scalewayKey,
                    fileSize: buffer.length,
                    mimeType: file.type || 'application/octet-stream',
                })
            } catch (fileError) {
                console.error(`Error uploading file ${file.name}:`, fileError)
                return NextResponse.json(
                    {
                        error: `Failed to upload file: ${file.name}`,
                        details:
                            fileError instanceof Error
                                ? fileError.message
                                : 'Unknown error',
                    },
                    { status: 500 },
                )
            }
        }

        console.log('All files uploaded successfully:', uploadResults.length)

        return NextResponse.json({
            success: true,
            files: uploadResults,
        })
    } catch (error) {
        console.error('Upload error:', error)

        // Handle specific error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return NextResponse.json(
                {
                    error: 'Network error: Could not connect to storage service',
                    details: error.message,
                },
                { status: 503 },
            )
        }

        if (error instanceof Error && error.message.includes('credentials')) {
            return NextResponse.json(
                {
                    error: 'Storage authentication failed',
                    details: 'Invalid or missing storage credentials',
                },
                { status: 500 },
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to upload files',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        )
    }
}
