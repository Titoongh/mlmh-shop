import { prisma } from '@/app/prisma'

// Types for backwards compatibility
export interface StripeCustomerData {
    customerId: string
    email: string | null
    purchases: StripePurchase[]
    createdAt: string
    updatedAt: string
}

export interface StripePurchase {
    sessionId: string
    paymentIntentId: string | null
    tablatureIds: string[]
    amount: number
    currency: string
    status: 'pending' | 'paid' | 'failed'
    purchasedAt: string
}

/**
 * Helper function to check if a user has purchased specific tablatures
 * Now uses Prisma database instead of KV storage
 */
export async function userHasPurchasedTablatures(
    userId: string,
    tablatureIds: string[],
): Promise<boolean> {
    try {
        // Query database for user's paid purchases that contain all requested tablatures
        const purchases = await prisma.purchase.findMany({
            where: {
                userId: userId,
                status: 'PAID',
            },
            include: {
                purchaseItems: {
                    where: {
                        tablatureId: { in: tablatureIds },
                    },
                },
            },
        })

        // Check if user has purchased ALL requested tablatures
        const purchasedTablatureIds = purchases
            .flatMap(p => p.purchaseItems)
            .map(item => item.tablatureId)

        return tablatureIds.every(id => purchasedTablatureIds.includes(id))
    } catch (error) {
        console.error('Error checking user purchases:', error)
        return false
    }
}

/**
 * Get all tablatures purchased by a user
 * Now uses Prisma database instead of KV storage
 */
export async function getUserPurchasedTablatures(
    userId: string,
): Promise<string[]> {
    try {
        const purchases = await prisma.purchase.findMany({
            where: {
                userId: userId,
                status: 'PAID',
            },
            include: {
                purchaseItems: true,
            },
        })

        return purchases
            .flatMap(p => p.purchaseItems)
            .map(item => item.tablatureId)
    } catch (error) {
        console.error('Error getting user purchases:', error)
        return []
    }
}
