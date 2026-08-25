import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getJobStatus } from '@/lib/download/job-store'

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

    return NextResponse.json(status)
}
