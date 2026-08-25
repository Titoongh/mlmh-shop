import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    getUserPurchasedMethodOffers,
    getUserPurchasedTablatures,
} from '@/services/stripe-kv'

export async function GET() {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User must be authenticated' },
                { status: 401 }
            )
        }

        const [purchasedTablatureIds, purchasedMethodOfferIds] =
            await Promise.all([
                getUserPurchasedTablatures(userId),
                getUserPurchasedMethodOffers(userId),
            ])

        return NextResponse.json({
            purchasedTablatures: purchasedTablatureIds,
            purchasedMethodOffers: purchasedMethodOfferIds,
        })
    } catch (error) {
        console.error('Error fetching user purchases:', error)
        return NextResponse.json(
            { error: 'Failed to fetch purchases' },
            { status: 500 }
        )
    }
}