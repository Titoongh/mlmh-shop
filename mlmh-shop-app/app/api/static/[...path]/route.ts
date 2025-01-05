import { NextResponse } from 'next/server'
import path, { join } from 'path'
import { readFile } from 'fs/promises'

const UPLOAD_DIR =
    process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads')

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } },
) {
    try {
        const filePath = join(UPLOAD_DIR, ...params.path)
        const file = await readFile(filePath)

        const ext = filePath.split('.').pop()?.toLowerCase()
        const contentType =
            {
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                mp3: 'audio/mpeg',
                mp4: 'video/mp4',
            }[ext || ''] || 'application/octet-stream'

        return new NextResponse(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            },
        })
    } catch (error) {
        console.error('Error serving static file:', error)
        return new NextResponse('Not found', { status: 404 })
    }
}
