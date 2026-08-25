import { NextRequest, NextResponse } from 'next/server'
import ScalewayService from '../../../../../services/scalewayv2'

// Upload des fichiers payants d'une méthode vers le bucket privé. Clone de
// ../tablature avec deux différences voulues :
// - extensions autorisées : documents + audio/vidéo (pdf/txt/jpg/jpeg/mp3/mp4) ;
// - clés préfixées `methods/<titre>/…` pour namespacer le bucket (les noms de
//   fichiers d'une méthode sont signifiants : on repart du nom original).

export const dynamic = 'force-dynamic'

const SCALEWAY_TABLATURES_BUCKET =
    process.env.SCALEWAY_TABLATURES_BUCKET || 'tablatures-dev'

const safeName = (value: string) =>
    value
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]
        const title = formData.get('title') as string

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

        const allowedExtensions = ['pdf', 'txt', 'jpg', 'jpeg', 'mp3', 'mp4']
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

        const scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )

        const prefix = `methods/${safeName(title)}`

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const fileExtension = file.name.split('.').pop()?.toLowerCase()

            console.log(
                `Processing method file ${i + 1}/${files.length}: ${file.name}`,
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
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                const baseName = safeName(
                    file.name.replace(/\.[^.]+$/, ''),
                ).slice(0, 80)
                const shortId = Math.random().toString(36).slice(2, 10)
                const scalewayKey = `${prefix}/${baseName}-${shortId}.${fileExtension}`

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

        console.log(
            'All method files uploaded successfully:',
            uploadResults.length,
        )

        return NextResponse.json({
            success: true,
            files: uploadResults,
        })
    } catch (error) {
        console.error('Method upload error:', error)
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
