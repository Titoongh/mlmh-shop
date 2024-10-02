import { Prisma } from '@prisma/client'

export const tablatureById = (id: string) =>
    ({
        id: id,
    }) satisfies Prisma.TablatureWhereUniqueInput
