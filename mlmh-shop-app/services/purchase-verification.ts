import { auth } from '@clerk/nextjs/server'
import {
    userHasPurchasedTablatures,
    getUserPurchasedTablatures,
} from './stripe-kv'
import { prisma } from '@/app/prisma'

export type PurchaseStatus =
    | 'PURCHASED'
    | 'NOT_PURCHASED'
    | 'UNAUTHENTICATED'
    | 'ERROR'

export interface PurchaseVerificationResult {
    status: PurchaseStatus
    hasPurchased: boolean
    purchasedTablatures?: string[]
    error?: string
}

/**
 * Purchase verification using database
 * This is the main function to check if user has purchased tablatures
 * Now uses direct database lookup instead of KV store
 */
export async function verifyUserPurchase(
    tablatureIds: string[],
): Promise<PurchaseVerificationResult> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return {
                status: 'UNAUTHENTICATED',
                hasPurchased: false,
            }
        }

        // Use database lookup
        const hasPurchased = await userHasPurchasedTablatures(
            userId,
            tablatureIds,
        )

        return {
            status: hasPurchased ? 'PURCHASED' : 'NOT_PURCHASED',
            hasPurchased,
            purchasedTablatures: hasPurchased ? tablatureIds : [],
        }
    } catch (error) {
        console.error('Error verifying purchase:', error)
        return {
            status: 'ERROR',
            hasPurchased: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Get all tablatures purchased by the current user
 */
export async function getUserPurchases(): Promise<PurchaseVerificationResult> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return {
                status: 'UNAUTHENTICATED',
                hasPurchased: false,
            }
        }

        const purchasedTablatures = await getUserPurchasedTablatures(userId)

        return {
            status:
                purchasedTablatures.length > 0 ? 'PURCHASED' : 'NOT_PURCHASED',
            hasPurchased: purchasedTablatures.length > 0,
            purchasedTablatures,
        }
    } catch (error) {
        console.error('Error getting user purchases:', error)
        return {
            status: 'ERROR',
            hasPurchased: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Server action for checking purchase (now just an alias since we only use database)
 * Kept for backwards compatibility
 */
export async function verifyUserPurchaseWithFallback(
    tablatureIds: string[],
): Promise<PurchaseVerificationResult> {
    // Since we now only use database, this is the same as verifyUserPurchase
    return verifyUserPurchase(tablatureIds)
}

/**
 * Middleware-friendly function to check purchase without auth context
 * Useful for API routes where you already have the userId
 */
export async function verifyPurchaseForUser(
    userId: string,
    tablatureIds: string[],
): Promise<boolean> {
    try {
        return await userHasPurchasedTablatures(userId, tablatureIds)
    } catch (error) {
        console.error('Error verifying purchase for user:', userId, error)
        return false
    }
}

/**
 * Check if user can download a specific session (legacy support)
 * This maintains backward compatibility with the old DownloadIntent system
 */
export async function canDownloadSession(sessionId: string): Promise<{
    canDownload: boolean
    reason?: string | undefined
    tablatureIds?: string[]
}> {
    try {
        // Check legacy DownloadIntent first
        const downloadIntent = await prisma.downloadIntent.findUnique({
            where: { stripeSessionId: sessionId },
            include: {
                downloads: {
                    include: {
                        tablature: true,
                    },
                },
            },
        })

        if (!downloadIntent) {
            return {
                canDownload: false,
                reason: 'Session not found',
            }
        }

        if (downloadIntent.success === false) {
            return {
                canDownload: false,
                reason: 'Payment was not successful',
            }
        }

        const tablatureIds = downloadIntent.downloads.map(d => d.tablatureId)

        // If success is null/undefined, check the session status directly
        if (
            downloadIntent.success === null ||
            downloadIntent.success === undefined
        ) {
            // This is where we'd normally check Stripe, but we can skip if we have a modern Purchase record
            const purchase = await prisma.purchase.findUnique({
                where: { stripeSessionId: sessionId },
            })

            if (purchase) {
                return {
                    canDownload: purchase.status === 'PAID',
                    reason:
                        purchase.status !== 'PAID'
                            ? `Purchase status: ${purchase.status}`
                            : undefined,
                    tablatureIds,
                }
            }

            // Fallback to Stripe check for legacy sessions
            const stripe = (await import('stripe')).default
            const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: '2024-09-30.acacia',
            })

            const session = await stripeClient.checkout.sessions.retrieve(
                sessionId,
            )

            return {
                canDownload: session.payment_status === 'paid',
                reason:
                    session.payment_status !== 'paid'
                        ? `Payment status: ${session.payment_status}`
                        : undefined,
                tablatureIds,
            }
        }

        return {
            canDownload: downloadIntent.success === true,
            tablatureIds,
        }
    } catch (error) {
        console.error(
            'Error checking download permission for session:',
            sessionId,
            error,
        )
        return {
            canDownload: false,
            reason: 'Error checking session',
        }
    }
}

/**
 * Get user's purchase history with detailed information
 */
export async function getUserPurchaseHistory(): Promise<{
    success: boolean
    purchases?: Array<{
        id: string
        sessionId: string
        totalAmount: number
        currency: string
        status: string
        createdAt: Date
        items: Array<{
            tablatureId: string
            tablatureTitle: string
            artistName: string
            priceAtPurchase: number
        }>
    }>
    error?: string
}> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Authentication required' }
        }

        const purchases = await prisma.purchase.findMany({
            where: { userId },
            include: {
                purchaseItems: {
                    include: {
                        tablature: {
                            include: {
                                artists: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        console.log(
            `Found ${purchases.length} purchases for user ${userId}:`,
            purchases.map(p => ({
                id: p.id,
                status: p.status,
                sessionId: p.stripeSessionId,
                totalAmount: p.totalAmount,
            })),
        )

        const formattedPurchases = purchases.map(purchase => ({
            id: purchase.id,
            sessionId: purchase.stripeSessionId,
            totalAmount: purchase.totalAmount,
            currency: purchase.currency,
            status: purchase.status,
            createdAt: purchase.createdAt,
            items: purchase.purchaseItems.map(item => ({
                tablatureId: item.tablatureId,
                tablatureTitle: item.tablature.title,
                artistName: item.tablature.artists[0]?.name || 'Unknown Artist',
                priceAtPurchase: item.priceAtPurchase,
            })),
        }))

        return {
            success: true,
            purchases: formattedPurchases,
        }
    } catch (error) {
        console.error('Error getting purchase history:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}
