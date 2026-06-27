import NextImage, { type ImageProps, type StaticImageData } from 'next/image'

/**
 * Drop-in pour next/image qui décide dynamiquement d'optimiser ou non.
 *
 * Règle :
 *  - source `.webp` → DÉJÀ optimisée/downscalée en amont (voir scripts/convertImagesToWebp.ts)
 *    → on BYPASSE l'optimiseur (`unoptimized`). La repasser dans /_next/image (sharp)
 *    ne réduit rien et, sur un serveur bridé, sature l'encodeur.
 *  - tout le reste (jpeg/png) → on LAISSE l'optimiseur Next resizer + convertir en webp
 *    à la volée. Pense à fournir une prop `sizes` correcte.
 *
 * Un `unoptimized` explicite passé en prop a toujours la priorité.
 */
function resolveSrcUrl(src: ImageProps['src']): string {
    if (typeof src === 'string') return src
    const data =
        (src as { default?: StaticImageData }).default ??
        (src as StaticImageData)
    return data?.src ?? ''
}

function isAlreadyOptimized(src: ImageProps['src']): boolean {
    return /\.webp(\?|#|$)/i.test(resolveSrcUrl(src))
}

export default function SmartImage({ unoptimized, ...props }: ImageProps) {
    return (
        <NextImage
            {...props}
            unoptimized={unoptimized ?? isAlreadyOptimized(props.src)}
        />
    )
}
