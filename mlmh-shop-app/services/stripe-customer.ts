import Stripe from 'stripe'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/app/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

export interface CustomerCreationResult {
    customerId: string
    isNewCustomer: boolean
}

/**
 * Get or create a Stripe customer for the current user
 * Following the video's advice: NEVER let someone checkout without a customer ID
 * This function ensures we always have a proper customer before proceeding
 */
export async function getOrCreateStripeCustomer(): Promise<CustomerCreationResult> {
    // Get the current authenticated user from Clerk
    const user = await currentUser()
    if (!user) {
        throw new Error('User must be authenticated to create Stripe customer')
    }

    const userId = user.id
    const userEmail = user.emailAddresses[0]?.emailAddress

    if (!userEmail) {
        throw new Error('User must have an email address')
    }

    try {
        // Check database for existing customer mapping
        const existingMapping = await prisma.stripeCustomer.findUnique({
            where: { userId },
        })

        if (existingMapping) {
            // Verify this customer exists in Stripe
            try {
                const customer = await stripe.customers.retrieve(
                    existingMapping.stripeCustomerId,
                )
                if (!customer.deleted) {
                    return {
                        customerId: existingMapping.stripeCustomerId,
                        isNewCustomer: false,
                    }
                }
            } catch (error) {
                // Customer doesn't exist, we'll need to create a new one
                console.warn(
                    'Database customer not found in Stripe, will recreate:',
                    existingMapping.stripeCustomerId,
                )
            }
        }

        // Need to create a new customer
        console.log('Creating new Stripe customer for user:', userId)

        const customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
                userId: userId,
                clerkUserId: userId, // Explicit for clarity
            },
            description: `Customer for user ${userId}`,
        })

        // Save the mapping in database
        await prisma.$transaction(async tx => {
            // Ensure User record exists
            await tx.user.upsert({
                where: { id: userId },
                update: {
                    email: userEmail,
                    updatedAt: new Date(),
                },
                create: {
                    id: userId,
                    email: userEmail,
                },
            })

            // Create StripeCustomer record
            await tx.stripeCustomer.upsert({
                where: { userId },
                update: {
                    stripeCustomerId: customer.id,
                    updatedAt: new Date(),
                },
                create: {
                    stripeCustomerId: customer.id,
                    userId: userId,
                },
            })
        })

        console.log(
            'Successfully created Stripe customer:',
            customer.id,
            'for user:',
            userId,
        )

        return {
            customerId: customer.id,
            isNewCustomer: true,
        }
    } catch (error) {
        console.error('Error creating/retrieving Stripe customer:', error)
        throw new Error(`Failed to create Stripe customer: ${error}`)
    }
}

/**
 * Get Stripe customer ID for a specific user (no creation)
 * Useful for checking if user has a customer without side effects
 */
export async function getStripeCustomerForUser(
    userId: string,
): Promise<string | null> {
    try {
        // Check database for customer mapping
        const mapping = await prisma.stripeCustomer.findUnique({
            where: { userId },
        })

        return mapping ? mapping.stripeCustomerId : null
    } catch (error) {
        console.error('Error getting Stripe customer for user:', error)
        return null
    }
}

/**
 * Ensure current user has a customer before proceeding with checkout
 * This is the function you call at the start of your checkout flow
 */
export async function ensureCustomerBeforeCheckout(): Promise<string> {
    try {
        const result = await getOrCreateStripeCustomer()

        if (result.isNewCustomer) {
            // Add a small delay to ensure Stripe customer is fully created
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        return result.customerId
    } catch (error) {
        console.error('Error ensuring customer before checkout:', error)
        throw error
    }
}

/**
 * Update customer information in Stripe when user profile changes
 */
export async function updateStripeCustomerInfo(
    userId: string,
    updates: {
        email?: string
        name?: string
    },
): Promise<void> {
    try {
        const customerId = await getStripeCustomerForUser(userId)
        if (!customerId) {
            throw new Error('No Stripe customer found for user')
        }

        if (updates.email && updates.name) {
            await stripe.customers.update(customerId, {
                email: updates.email,
                name: updates.name,
            })
        } else if (updates.email) {
            await stripe.customers.update(customerId, {
                email: updates.email,
            })
        } else if (updates.name) {
            await stripe.customers.update(customerId, {
                name: updates.name,
            })
        }

        console.log('Updated Stripe customer:', customerId)
    } catch (error) {
        console.error('Error updating Stripe customer:', error)
        throw error
    }
}
