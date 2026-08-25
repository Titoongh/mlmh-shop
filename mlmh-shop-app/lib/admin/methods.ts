import { Prisma } from '@prisma/client'
import { prisma } from '@/app/prisma'
import { revalidateMethods } from '@/lib/db/revalidate'
import { generateUniqueSlug } from '@/lib/slug'
import {
    methodCreateSchema,
    methodUpdateSchema,
    MethodFileInput,
    MethodLessonInput,
    MethodOfferInput,
} from './validation'

// Couche métier admin pour les méthodes — même architecture que
// lib/admin/tablatures.ts (source de vérité unique, consommée par les server
// actions ET les routes REST /api/admin/methods*). Voir docs/admin-api.md.
//
// Différence structurelle avec les tablatures : leçons, fichiers et offres
// sont interdépendants (les fichiers/offres pointent des leçons via lessonRef,
// et les offres vendues acquièrent des FKs PurchaseItem). D'où :
// - création/màj de la structure en une seule $transaction ;
// - fichiers = remplacement complet (rien ne les référence de l'extérieur) ;
// - offres = upsert ; une offre absente du payload est passée hidden, JAMAIS
//   supprimée (protège PurchaseItem.methodOfferId).

export const adminMethodInclude = {
    artists: true,
    musicalGenres: true,
    contents: true,
    lessons: { orderBy: { rank: 'asc' as const } },
    files: true,
    offers: { include: { lesson: true } },
} satisfies Prisma.MethodInclude

export type AdminMethod = Prisma.MethodGetPayload<{
    include: typeof adminMethodInclude
}>

async function uniqueMethodSlug(title: string) {
    return generateUniqueSlug(
        title,
        async s =>
            !!(await prisma.method.findUnique({
                where: { slug: s },
                select: { id: true },
            })),
    )
}

export interface ListMethodsOptions {
    q?: string
    hidden?: boolean
}

export async function listMethods(options: ListMethodsOptions = {}) {
    const where: Prisma.MethodWhereInput = {
        ...(options.hidden !== undefined ? { hidden: options.hidden } : {}),
        ...(options.q
            ? {
                  OR: [
                      { title: { contains: options.q, mode: 'insensitive' } },
                      {
                          artists: {
                              some: {
                                  name: {
                                      contains: options.q,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      },
                  ],
              }
            : {}),
    }

    return prisma.method.findMany({
        where,
        include: {
            artists: { select: { id: true, name: true } },
            musicalGenres: { select: { id: true, name: true } },
            _count: { select: { lessons: true, files: true, offers: true } },
        },
        orderBy: { title: 'asc' },
    })
}

export type AdminMethodListItem = Awaited<
    ReturnType<typeof listMethods>
>[number]

export async function getMethod(id: string): Promise<AdminMethod | null> {
    return prisma.method.findUnique({
        where: { id },
        include: adminMethodInclude,
    })
}

// Crée les leçons d'un payload et retourne la table ref → id DB.
async function createLessons(
    tx: Prisma.TransactionClient,
    methodId: string,
    lessons: MethodLessonInput[],
): Promise<Map<string, string>> {
    const refToId = new Map<string, string>()
    for (const lesson of lessons) {
        const created = await tx.methodLesson.create({
            data: { methodId, title: lesson.title, rank: lesson.rank },
        })
        refToId.set(lesson.ref, created.id)
    }
    return refToId
}

function fileCreateData(
    methodId: string,
    file: MethodFileInput,
    refToId: Map<string, string>,
) {
    return {
        methodId,
        filename: file.filename,
        scalewayKey: file.scalewayKey,
        role: file.role,
        ...(file.fileSize != null ? { fileSize: file.fileSize } : {}),
        ...(file.mimeType != null ? { mimeType: file.mimeType } : {}),
        ...(file.lessonRef
            ? { lessonId: refToId.get(file.lessonRef) ?? null }
            : {}),
    }
}

export async function createMethod(input: unknown): Promise<AdminMethod> {
    const data = methodCreateSchema.parse(input)

    const slug = await uniqueMethodSlug(data.title)

    const method = await prisma.$transaction(async tx => {
        const created = await tx.method.create({
            data: {
                title: data.title,
                slug,
                hidden: data.hidden,
                ...(data.description !== undefined
                    ? { description: data.description }
                    : {}),
                ...(data.publicationDate !== undefined
                    ? { publicationDate: data.publicationDate }
                    : {}),
                artists: { connect: data.artists.map(id => ({ id })) },
                musicalGenres: {
                    connect: data.musicalGenres.map(id => ({ id })),
                },
                contents: {
                    create: data.contents.map(c => ({
                        type: c.type,
                        url: c.url,
                        rank: c.rank,
                    })),
                },
            },
        })

        const refToId = await createLessons(tx, created.id, data.lessons)

        if (data.files.length > 0) {
            await tx.methodFile.createMany({
                data: data.files.map(f =>
                    fileCreateData(created.id, f, refToId),
                ),
            })
        }

        for (const offer of data.offers) {
            await tx.methodOffer.create({
                data: {
                    methodId: created.id,
                    kind: offer.kind,
                    title: offer.title,
                    price: offer.price,
                    hidden: offer.hidden,
                    ...(offer.lessonRef
                        ? { lessonId: refToId.get(offer.lessonRef) ?? null }
                        : {}),
                },
            })
        }

        return created
    })

    revalidateMethods(method.id)
    return (await getMethod(method.id)) as AdminMethod
}

export async function updateMethod(
    id: string,
    input: unknown,
): Promise<AdminMethod> {
    const data = methodUpdateSchema.parse(input)

    // La résolution des lessonRef exige la structure complète : les trois
    // listes se mettent à jour ensemble ou pas du tout.
    const structureProvided = [data.lessons, data.files, data.offers].filter(
        part => part !== undefined,
    )
    if (structureProvided.length > 0 && structureProvided.length < 3) {
        throw new Error(
            'lessons, files et offers doivent être fournis ensemble',
        )
    }

    const updateData: Prisma.MethodUpdateInput = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.hidden !== undefined ? { hidden: data.hidden } : {}),
        ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        ...(data.publicationDate !== undefined
            ? { publicationDate: data.publicationDate }
            : {}),
    }

    // Slugs stables : jamais modifiés, seulement backfillés s'ils manquent.
    const existing = await prisma.method.findUnique({
        where: { id },
        select: { slug: true, title: true },
    })
    if (!existing) {
        throw new Error('Méthode introuvable')
    }
    if (!existing.slug) {
        updateData.slug = await uniqueMethodSlug(data.title ?? existing.title)
    }

    if (data.artists !== undefined) {
        updateData.artists = {
            set: [],
            connect: data.artists.map(artistId => ({ id: artistId })),
        }
    }
    if (data.musicalGenres !== undefined) {
        updateData.musicalGenres = {
            set: [],
            connect: data.musicalGenres.map(genreId => ({ id: genreId })),
        }
    }
    if (data.contents !== undefined) {
        updateData.contents = {
            deleteMany: {},
            create: data.contents.map(c => ({
                type: c.type,
                url: c.url,
                rank: c.rank,
            })),
        }
    }

    await prisma.$transaction(async tx => {
        await tx.method.update({ where: { id }, data: updateData })

        if (
            data.lessons !== undefined &&
            data.files !== undefined &&
            data.offers !== undefined
        ) {
            await reconcileStructure(tx, id, {
                lessons: data.lessons,
                files: data.files,
                offers: data.offers,
            })
        }
    })

    revalidateMethods(id)
    return (await getMethod(id)) as AdminMethod
}

// Réconcilie leçons/fichiers/offres avec le payload :
// - leçons : upsert par ref (ref = id DB pour une leçon existante) ; les leçons
//   absentes sont supprimées (cascade sur leurs fichiers ; les offres qui les
//   référencent perdent leur lessonId — SetNull — mais restent en DB).
// - fichiers : remplacement complet.
// - offres : upsert par id ; les offres absentes passent hidden (jamais
//   supprimées, elles peuvent être référencées par des PurchaseItem).
async function reconcileStructure(
    tx: Prisma.TransactionClient,
    methodId: string,
    payload: {
        lessons: MethodLessonInput[]
        files: MethodFileInput[]
        offers: MethodOfferInput[]
    },
) {
    const existingLessons = await tx.methodLesson.findMany({
        where: { methodId },
        select: { id: true },
    })
    const existingLessonIds = new Set(existingLessons.map(l => l.id))

    const refToId = new Map<string, string>()
    for (const lesson of payload.lessons) {
        if (existingLessonIds.has(lesson.ref)) {
            await tx.methodLesson.update({
                where: { id: lesson.ref },
                data: { title: lesson.title, rank: lesson.rank },
            })
            refToId.set(lesson.ref, lesson.ref)
        } else {
            const created = await tx.methodLesson.create({
                data: { methodId, title: lesson.title, rank: lesson.rank },
            })
            refToId.set(lesson.ref, created.id)
        }
    }

    const keptLessonIds = new Set(refToId.values())
    const toDelete = Array.from(existingLessonIds).filter(
        lessonId => !keptLessonIds.has(lessonId),
    )
    if (toDelete.length > 0) {
        await tx.methodLesson.deleteMany({
            where: { id: { in: toDelete } },
        })
    }

    await tx.methodFile.deleteMany({ where: { methodId } })
    if (payload.files.length > 0) {
        await tx.methodFile.createMany({
            data: payload.files.map(f => fileCreateData(methodId, f, refToId)),
        })
    }

    const existingOffers = await tx.methodOffer.findMany({
        where: { methodId },
        select: { id: true },
    })
    const payloadOfferIds = new Set(
        payload.offers.map(o => o.id).filter((v): v is string => !!v),
    )
    for (const offer of payload.offers) {
        const offerData = {
            kind: offer.kind,
            title: offer.title,
            price: offer.price,
            hidden: offer.hidden,
            lessonId: offer.lessonRef
                ? refToId.get(offer.lessonRef) ?? null
                : null,
        }
        if (offer.id) {
            await tx.methodOffer.update({
                where: { id: offer.id },
                data: offerData,
            })
        } else {
            await tx.methodOffer.create({
                data: { methodId, ...offerData },
            })
        }
    }
    const absentOfferIds = existingOffers
        .map(o => o.id)
        .filter(offerId => !payloadOfferIds.has(offerId))
    if (absentOfferIds.length > 0) {
        await tx.methodOffer.updateMany({
            where: { id: { in: absentOfferIds } },
            data: { hidden: true },
        })
    }
}

export async function setMethodHidden(id: string, hidden: boolean) {
    const method = await prisma.method.update({
        where: { id },
        data: { hidden },
    })
    revalidateMethods(id)
    return method
}

// Suppression définitive — non exposée dans l'UI (on utilise `hidden`), gardée
// pour l'API/outillage. Cascade sur lessons/files/contents/offers ; échoue si
// des ventes (PurchaseItem) référencent une offre — c'est voulu.
export async function deleteMethod(id: string) {
    const method = await prisma.method.delete({ where: { id } })
    revalidateMethods(id)
    return method
}
