import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { withAuth } from '../../../lib/firebase/withAuth'

const UPLOAD_DIR =
    process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads')

export const POST = withAuth(async (request: NextRequest) => {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 },
            )
        }

        // Ensure upload directory exists
        try {
            await mkdir(UPLOAD_DIR, { recursive: true })
        } catch (err) {
            console.log('Directory exists or creation failed:', err)
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        // Sanitize filename: remove spaces and special characters, keep only alphanumeric, dots, and hyphens
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
        const filename = `${uniqueSuffix}-${sanitizedName}`
        const filepath = path.join(UPLOAD_DIR, filename)

        await writeFile(filepath, buffer)

        // Return the relative URL path
        // const url = `/uploads/${filename}`
        const url = `/api/static/${filename}`

        return NextResponse.json({ url })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
})
