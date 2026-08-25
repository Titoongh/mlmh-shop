import type { MethodFile, MethodOffer } from '@prisma/client'

/**
 * Single source of truth mapping a purchased offer to the files it delivers.
 * Delivery is derived by rule (never stored per offer), so files added to a
 * method later automatically fall into the right scope:
 * - FULL:      every file of the method (method-level + all lessons)
 * - DOCUMENTS: only role=DOCUMENT files (booklet cover + each lesson's PDF)
 * - LESSON:    only the referenced lesson's files (its PDF + its audio).
 *              The method-level cover is intentionally NOT included.
 */
export function filesForOffer<
    F extends Pick<MethodFile, 'role' | 'lessonId'>,
>(offer: Pick<MethodOffer, 'kind' | 'lessonId'>, files: F[]): F[] {
    switch (offer.kind) {
        case 'FULL':
            return files
        case 'DOCUMENTS':
            return files.filter(file => file.role === 'DOCUMENT')
        case 'LESSON':
            return files.filter(
                file =>
                    file.lessonId !== null && file.lessonId === offer.lessonId,
            )
    }
}
