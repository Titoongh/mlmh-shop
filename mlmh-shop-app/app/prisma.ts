import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // Full query logging drowns the server logs; opt back in locally with
        // PRISMA_LOG_QUERIES=1 when debugging a specific query.
        log:
            process.env.PRISMA_LOG_QUERIES === '1'
                ? ['query', 'warn', 'error']
                : ['warn', 'error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
