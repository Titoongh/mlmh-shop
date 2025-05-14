import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['query'] })

const main = async () => {
    try {
        // Update all tablatures to have a price of 5
        const updateResult = await prisma.tablature.updateMany({
            where: {}, // Empty where clause to affect all records
            data: {
                price: 4.5,
            },
        })

        console.log(
            `Successfully updated ${updateResult.count} tablature(s) with price = 5`,
        )
    } catch (error) {
        console.error('Error updating tablature prices:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .then(() => {
        console.log('Price update completed successfully')
    })
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
