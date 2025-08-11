/**
 * Migration Script: Migrate existing DownloadIntent/Download data to new robust Stripe system
 * 
 * This script:
 * 1. Creates User records for existing email addresses
 * 2. Creates Stripe customers for existing successful purchases  
 * 3. Migrates DownloadIntent records to Purchase records
 * 4. Populates the KV store with existing purchase data
 * 
 * Run with: tsx scripts/migrate-to-robust-stripe.ts
 */

import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'
import { stripeCustomerKV, stripeDataKV, StripeCustomerData, StripePurchase } from '../services/stripe-kv'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

interface MigrationStats {
    totalDownloadIntents: number
    successfulDownloadIntents: number
    customersCreated: number
    purchasesCreated: number
    kvEntriesCreated: number
    errors: string[]
}

async function migrateToRobustStripe(): Promise<MigrationStats> {
    const stats: MigrationStats = {
        totalDownloadIntents: 0,
        successfulDownloadIntents: 0,
        customersCreated: 0,
        purchasesCreated: 0,
        kvEntriesCreated: 0,
        errors: []
    }

    console.log('🚀 Starting migration to robust Stripe system...')
    
    try {
        // Step 1: Get all successful DownloadIntents with email addresses
        console.log('📊 Analyzing existing download intents...')
        
        const downloadIntents = await prisma.downloadIntent.findMany({
            include: {
                downloads: {
                    include: {
                        tablature: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        stats.totalDownloadIntents = downloadIntents.length
        console.log(`Found ${downloadIntents.length} download intents`)

        const successfulIntents = downloadIntents.filter(intent => 
            intent.success === true && intent.email
        )
        stats.successfulDownloadIntents = successfulIntents.length
        console.log(`Found ${successfulIntents.length} successful intents with email addresses`)

        // Step 2: Group by email to create users and customers
        const emailGroups = new Map<string, typeof successfulIntents>()
        
        for (const intent of successfulIntents) {
            if (intent.email) {
                const email = intent.email.toLowerCase()
                if (!emailGroups.has(email)) {
                    emailGroups.set(email, [])
                }
                emailGroups.get(email)!.push(intent)
            }
        }

        console.log(`Found ${emailGroups.size} unique email addresses`)

        // Step 3: Process each email group
        for (const [email, intents] of emailGroups) {
            try {
                console.log(`\n👤 Processing email: ${email} (${intents.length} purchases)`)
                
                // Generate a user ID for this email (since we don't have Clerk users yet)
                // In production, you might want to create actual Clerk users or use a different strategy
                const userId = `migrated_${email.replace(/[@.]/g, '_')}_${Date.now()}`
                
                // Step 3a: Create User record
                const user = await prisma.user.upsert({
                    where: { email },
                    update: {},
                    create: {
                        id: userId,
                        email,
                    }
                })

                // Step 3b: Create Stripe customer
                console.log(`  🏪 Creating Stripe customer for ${email}`)
                const customer = await stripe.customers.create({
                    email,
                    metadata: {
                        userId: user.id,
                        migratedFrom: 'downloadIntent',
                        migrationDate: new Date().toISOString()
                    },
                    description: `Migrated customer for ${email}`
                })

                stats.customersCreated++

                // Step 3c: Create StripeCustomer record
                await prisma.stripeCustomer.upsert({
                    where: { userId: user.id },
                    update: {
                        stripeCustomerId: customer.id
                    },
                    create: {
                        stripeCustomerId: customer.id,
                        userId: user.id
                    }
                })

                // Step 3d: Store user -> customer mapping in KV
                await stripeCustomerKV.set(user.id, customer.id)

                // Step 3e: Process each purchase for this customer
                const purchases: StripePurchase[] = []
                
                for (const intent of intents) {
                    try {
                        // Get session details from Stripe if possible
                        let sessionDetails: Stripe.Checkout.Session | null = null
                        try {
                            sessionDetails = await stripe.checkout.sessions.retrieve(intent.stripeSessionId)
                        } catch (error) {
                            console.log(`    ⚠️ Could not retrieve session ${intent.stripeSessionId}: ${error.message}`)
                        }

                        // Calculate total amount
                        const totalAmount = intent.downloads.reduce((sum, download) => {
                            return sum + (download.tablature.price * 100) // Convert to cents
                        }, 0)

                        // Create Purchase record
                        const purchase = await prisma.purchase.create({
                            data: {
                                stripeSessionId: intent.stripeSessionId,
                                stripeCustomerId: customer.id,
                                userId: user.id,
                                totalAmount,
                                currency: 'usd',
                                status: 'PAID', // Since it was successful in the old system
                                createdAt: intent.createdAt,
                                purchaseItems: {
                                    create: intent.downloads.map(download => ({
                                        tablatureId: download.tablatureId,
                                        priceAtPurchase: download.tablature.price * 100,
                                        currency: 'usd'
                                    }))
                                }
                            }
                        })

                        stats.purchasesCreated++

                        // Add to purchases array for KV store
                        purchases.push({
                            sessionId: intent.stripeSessionId,
                            paymentIntentId: sessionDetails?.payment_intent as string || null,
                            tablatureIds: intent.downloads.map(d => d.tablatureId),
                            amount: totalAmount,
                            currency: 'usd',
                            status: 'paid',
                            purchasedAt: intent.createdAt.toISOString()
                        })

                        console.log(`    ✅ Migrated purchase ${intent.id} -> ${purchase.id}`)
                        
                    } catch (error) {
                        const errorMsg = `Failed to migrate purchase ${intent.id}: ${error.message}`
                        console.error(`    ❌ ${errorMsg}`)
                        stats.errors.push(errorMsg)
                    }
                }

                // Step 3f: Store customer data in KV
                const customerData: StripeCustomerData = {
                    customerId: customer.id,
                    email,
                    purchases,
                    createdAt: customer.created ? new Date(customer.created * 1000).toISOString() : new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }

                await stripeDataKV.set(customer.id, customerData)
                stats.kvEntriesCreated++

                console.log(`  ✅ Completed migration for ${email}: ${purchases.length} purchases`)

            } catch (error) {
                const errorMsg = `Failed to process email ${email}: ${error.message}`
                console.error(`❌ ${errorMsg}`)
                stats.errors.push(errorMsg)
            }
        }

        console.log('\n🎉 Migration completed!')
        return stats

    } catch (error) {
        console.error('💥 Migration failed:', error)
        stats.errors.push(`Migration failed: ${error.message}`)
        return stats
    } finally {
        await prisma.$disconnect()
    }
}

async function printMigrationSummary(stats: MigrationStats) {
    console.log('\n📈 MIGRATION SUMMARY')
    console.log('==================')
    console.log(`Total Download Intents: ${stats.totalDownloadIntents}`)
    console.log(`Successful Download Intents: ${stats.successfulDownloadIntents}`)
    console.log(`Stripe Customers Created: ${stats.customersCreated}`)
    console.log(`Purchase Records Created: ${stats.purchasesCreated}`)
    console.log(`KV Store Entries Created: ${stats.kvEntriesCreated}`)
    console.log(`Errors: ${stats.errors.length}`)
    
    if (stats.errors.length > 0) {
        console.log('\n❌ ERRORS:')
        stats.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`)
        })
    }

    console.log('\n✅ Next Steps:')
    console.log('1. Test the new checkout flow with /api/checkout-v2')
    console.log('2. Test the new webhook handler at /api/webhook/stripe-v2')
    console.log('3. Test user downloads at /user/downloads')
    console.log('4. Update your Stripe webhook endpoint in the dashboard')
    console.log('5. Gradually switch traffic from old endpoints to new ones')
    console.log('6. Monitor both systems during the transition period')
}

// Run migration if called directly
if (require.main === module) {
    migrateToRobustStripe()
        .then(printMigrationSummary)
        .catch(console.error)
}

export { migrateToRobustStripe }