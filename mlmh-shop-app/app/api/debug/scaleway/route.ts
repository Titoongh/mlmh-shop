import { NextResponse } from 'next/server'
import ScalewayService from '@/services/scalewayv2'

export async function GET() {
    try {
        console.log('Testing Scaleway configuration...')

        // Check environment variables
        const envCheck = {
            SCW_ACCESS_KEY: !!process.env.SCW_ACCESS_KEY,
            SCW_SECRET_KEY: !!process.env.SCW_SECRET_KEY,
            SCW_REGION: process.env.SCW_REGION || 'not set',
            SCW_ENDPOINT: process.env.SCW_ENDPOINT || 'not set',
            SCALEWAY_TABLATURES_BUCKET:
                process.env.SCALEWAY_TABLATURES_BUCKET || 'not set',
        }

        console.log('Environment variables:', envCheck)

        // Try to initialize Scaleway service
        const scalewayService = new ScalewayService()

        // Try to list buckets
        const buckets = await scalewayService.listBuckets()

        return NextResponse.json({
            status: 'success',
            environment: envCheck,
            bucketsFound: buckets.length,
            buckets: buckets.map(b => b.Name).slice(0, 5), // First 5 bucket names
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Scaleway test failed:', error)
        return NextResponse.json(
            {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                environment: {
                    SCW_ACCESS_KEY: !!process.env.SCW_ACCESS_KEY,
                    SCW_SECRET_KEY: !!process.env.SCW_SECRET_KEY,
                    SCW_REGION: process.env.SCW_REGION || 'not set',
                    SCW_ENDPOINT: process.env.SCW_ENDPOINT || 'not set',
                    SCALEWAY_TABLATURES_BUCKET:
                        process.env.SCALEWAY_TABLATURES_BUCKET || 'not set',
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        )
    }
}
