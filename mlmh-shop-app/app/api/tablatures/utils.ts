import { Prisma } from '@prisma/client'

export const tablatureById = (id: string) =>
    ({
        id: id,
    } satisfies Prisma.TablatureWhereUniqueInput)

export const safeTablatureSelect = {
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    title: true,
    price: true,
    publicationDate: true,
    description: true,
    musicalGenres: true,
    contents: true,
    artists: true,
    hidden: true,
    files: true,
} as const
