import { Prisma } from '@prisma/client'

export const artistById = (id: string) =>
    ({
        id: id,
    }) satisfies Prisma.ArtistWhereUniqueInput
