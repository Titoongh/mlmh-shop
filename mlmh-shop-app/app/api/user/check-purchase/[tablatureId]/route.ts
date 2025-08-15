import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { verifyUserPurchase } from '@/services/purchase-verification'

export async function GET(
    request: Request,
    { params }: { params: { tablatureId: string } }
) {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json(
                { hasPurchased: false, authenticated: false },
                { status: 200 }
            )
        }

        const { tablatureId } = params
        const result = await verifyUserPurchase([tablatureId])

        return NextResponse.json({
            hasPurchased: result.hasPurchased,
            authenticated: true,
            status: result.status,
        })
    } catch (error) {
        console.error('Error checking purchase:', error)
        return NextResponse.json(
            { 
                hasPurchased: false, 
                authenticated: false, 
                error: 'Failed to check purchase status' 
            },
            { status: 500 }
        )
    }
}