import Stripe from 'stripe'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

/**
 * Core function that syncs the latest Stripe data to our database
 * This is called from both webhooks and the success page to ensure consistency
 * Following the pattern from the video - don't trust webhooks, pull fresh data
 */
export async function updateDatabaseWithLatestStripeData(
    customerId: string,
): Promise<void> {
    try {
        console.log('Syncing stripe data for customer:', customerId)

        // Get all checkout sessions for this customer
        const sessions = await stripe.checkout.sessions.list({
            customer: customerId,
            limit: 100, // Adjust as needed
        })

        // Process each session to ensure we have Purchase records
        for (const session of sessions.data) {
            if (session.mode === 'payment') {
                // Get line items to extract tablature IDs from metadata
                const lineItems = await stripe.checkout.sessions.listLineItems(
                    session.id,
                    {
                        expand: ['data.price.product'],
                    },
                )

                const tablatureIds: string[] = []
                const priceData: { tablatureId: string; price: number }[] = []

                for (const item of lineItems.data) {
                    if (
                        item.price?.product &&
                        typeof item.price.product === 'object'
                    ) {
                        const tabId = 'metadata' in item.price.product ? item.price.product.metadata?.tabId : undefined
                        if (tabId) {
                            tablatureIds.push(tabId)
                            priceData.push({
                                tablatureId: tabId,
                                price: item.price.unit_amount || 0,
                            })
                        }
                    }
                }

                let status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' =
                    'PENDING'
                if (session.payment_status === 'paid') {
                    status = 'PAID'
                } else if (
                    session.payment_status === 'unpaid' &&
                    session.status === 'expired'
                ) {
                    status = 'CANCELLED'
                }

                // Find the user ID associated with this customer
                const stripeCustomer = await prisma.stripeCustomer.findUnique({
                    where: { stripeCustomerId: customerId },
                })

                if (!stripeCustomer) {
                    console.warn(
                        `No user mapping found for customer: ${customerId}`,
                    )
                    continue
                }

                // Upsert the Purchase record
                await prisma.purchase.upsert({
                    where: { stripeSessionId: session.id },
                    update: {
                        status,
                        totalAmount: session.amount_total || 0,
                        currency: session.currency || 'usd',
                        stripePaymentIntentId: session.payment_intent as
                            | string
                            | null,
                        updatedAt: new Date(),
                    },
                    create: {
                        stripeSessionId: session.id,
                        stripePaymentIntentId: session.payment_intent as
                            | string
                            | null,
                        stripeCustomerId: customerId,
                        totalAmount: session.amount_total || 0,
                        currency: session.currency || 'usd',
                        status,
                        userId: stripeCustomer.userId,
                        purchaseItems: {
                            create: priceData.map(item => ({
                                tablatureId: item.tablatureId,
                                priceAtPurchase: item.price,
                                currency: session.currency || 'usd',
                            })),
                        },
                    },
                    include: {
                        purchaseItems: true,
                    },
                })
            }
        }

        console.log(`Successfully synced purchases for customer ${customerId}`)
    } catch (error) {
        console.error('Error updating database with stripe data:', error)
        throw error
    }
}

/**
 * Force sync for a specific user by their userId
 * This is useful when we need to refresh data for a logged-in user
 */
export async function triggerStripeSyncForUser(userId: string): Promise<void> {
    try {
        // Get the customer ID from our database
        const stripeCustomer = await prisma.stripeCustomer.findUnique({
            where: { userId },
        })

        if (!stripeCustomer) {
            console.log('No customer ID found for user:', userId)
            return
        }

        await updateDatabaseWithLatestStripeData(
            stripeCustomer.stripeCustomerId,
        )
    } catch (error) {
        console.error('Error syncing stripe data for user:', error)
        throw error
    }
}

/**
 * Batch sync multiple customers
 * Useful for maintenance or initial data population
 */
export async function batchSyncStripeData(
    customerIds: string[],
): Promise<void> {
    console.log(`Starting batch sync for ${customerIds.length} customers`)

    for (const customerId of customerIds) {
        try {
            await updateDatabaseWithLatestStripeData(customerId)
        } catch (error) {
            console.error(`Failed to sync customer ${customerId}:`, error)
            // Continue with other customers even if one fails
        }
    }

    console.log('Batch sync completed')
}
