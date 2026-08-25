import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getJobStatus, consumeJobResult } from '@/lib/download/job-store'

export async function GET(request: NextRequest) {
    const jobId = new URL(request.url).searchParams.get('jobId')
    if (!jobId) {
        return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const status = getJobStatus(jobId, userId)
    if (!status) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (status.status === 'error') {
        return NextResponse.json(
            { error: status.error || 'Download failed' },
            { status: 500 },
        )
    }
    if (status.status !== 'done') {
        return NextResponse.json({ error: 'Not ready yet' }, { status: 409 })
    }

    const result = consumeJobResult(jobId, userId)
    if (!result) {
        return NextResponse.json(
            { error: 'Job result unavailable' },
            { status: 404 },
        )
    }

    return new NextResponse(result.zipBuffer, {
        headers: {
            'Content-Disposition': `attachment; filename="${result.filename}"`,
            'Content-Type': 'application/zip',
            'Content-Length': result.zipBuffer.byteLength.toString(),
        },
    })
}
