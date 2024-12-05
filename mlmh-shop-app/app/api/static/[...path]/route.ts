import { NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads'

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } },
) {
    try {
        const filePath = join(UPLOAD_DIR, ...params.path)
        console.log('get file uploaded', filePath)
        const file = await readFile(filePath)
        console.log('file', file)

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

// export async function GET(
//     request: Request,
//     { params }: { params: { path: string[] } },
// ) {
//     try {
//         const filePath = join(UPLOAD_DIR, ...params.path)
//         console.log('get file uploaded')

//         try {
//             const stats = statSync(filePath)
//             if (!stats.isFile()) {
//                 return new NextResponse('Not found', { status: 404 })
//             }
//         } catch (err) {
//             return new NextResponse('Not found', { status: 404 })
//         }

//         const fileStream = createReadStream(filePath)
//         const stream = new ReadableStream({
//             start(controller) {
//                 fileStream.on('data', chunk => controller.enqueue(chunk))
//                 fileStream.on('end', () => controller.close())
//                 fileStream.on('error', err => controller.error(err))
//             },
//         })

//         // Determine content type based on file extension
//         const ext = filePath.split('.').pop()?.toLowerCase()
//         const contentType =
//             {
//                 png: 'image/png',
//                 jpg: 'image/jpeg',
//                 jpeg: 'image/jpeg',
//                 gif: 'image/gif',
//                 mp3: 'audio/mpeg',
//                 mp4: 'video/mp4',
//             }[ext || ''] || 'application/octet-stream'

//         return new NextResponse(stream, {
//             headers: {
//                 'Content-Type': contentType,
//                 'Cache-Control': 'public, max-age=31536000',
//             },
//         })
//     } catch (error) {
//         console.error('Error serving static file:', error)
//         return new NextResponse('Internal Server Error', { status: 500 })
//     }
// }
