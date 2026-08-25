// Public-facing selects for methods. Unlike safeTablatureSelect, these never
// expose paid-file storage data (scalewayKey/filename): the file manifest only
// carries what the product page needs to display badges and counts.
export const methodFileManifestSelect = {
    id: true,
    role: true,
    lessonId: true,
    fileSize: true,
    mimeType: true,
} as const

export const safeMethodOfferSelect = {
    id: true,
    createdAt: true,
    updatedAt: true,
    kind: true,
    title: true,
    price: true,
    hidden: true,
    methodId: true,
    lessonId: true,
    lesson: { select: { id: true, title: true } },
    method: { select: { id: true, title: true, slug: true } },
} as const

export const safeMethodSelect = {
    id: true,
    createdAt: true,
    updatedAt: true,
    title: true,
    slug: true,
    description: true,
    hidden: true,
    publicationDate: true,
    musicalGenres: true,
    contents: true,
    lessons: { orderBy: { rank: 'asc' as const } },
    offers: {
        where: { hidden: false },
        include: { lesson: true },
    },
    files: { select: methodFileManifestSelect },
} as const
