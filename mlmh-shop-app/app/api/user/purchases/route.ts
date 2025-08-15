import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPurchasedTablatures } from '@/services/stripe-kv'

export async function GET() {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User must be authenticated' },
                { status: 401 }
            )
        }

        const purchasedTablatureIds = await getUserPurchasedTablatures(userId)
        
        return NextResponse.json({
            purchasedTablatures: purchasedTablatureIds
        })
    } catch (error) {
        console.error('Error fetching user purchases:', error)
        return NextResponse.json(
            { error: 'Failed to fetch purchases' },
            { status: 500 }
        )
    }
}