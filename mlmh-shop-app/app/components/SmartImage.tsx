import NextImage, { type ImageProps, type StaticImageData } from 'next/image'

// Image servie depuis le bucket Scaleway PUBLIC, via URL directe figée dans le
// HTML (statique/SSR). Aucun fetch client, aucun skeleton : la résolution d'URL
// est un simple calcul de chaîne, identique côté serveur et client.
//
// Règle d'optimisation : une source `.webp` est déjà optimisée → on bypasse
// l'optimiseur Next (`unoptimized`). Le reste passe par l'optimiseur (resize +
// conversion à la volée). Un `unoptimized` explicite a la priorité.
//
// ⚠️ Le bucket des IMAGES doit être en lecture publique. Les fichiers de
// tablatures (PDF) restent dans un bucket privé et NE passent PAS par ici.

const STORAGE_PREFIXES = ['/public/storage/', '/public/uploads/', '/api/static/']

// Transforme une référence stockée (chemin /public/storage/<key>, /public/uploads/,
// /api/static/, ou clé nue) en URL publique directe. Une URL absolue ou un asset
// local (public/) est renvoyé tel quel.
function toPublicUrl(src: string): string {
    if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
        return src
    }
    const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? ''
    for (const prefix of STORAGE_PREFIXES) {
        if (src.startsWith(prefix)) return `${base}/${src.slice(prefix.length)}`
    }
    if (src.startsWith('/')) return src // asset local servi depuis /public
    return base ? `${base}/${src}` : src
}

function resolveSrcUrl(src: ImageProps['src']): string {
    if (typeof src === 'string') return src
    const data =
        (src as { default?: StaticImageData }).default ??
        (src as StaticImageData)
    return data?.src ?? ''
}

function isAlreadyOptimized(url: string): boolean {
    return /\.webp(\?|#|$)/i.test(url)
}

export default function SmartImage({ src, unoptimized, ...props }: ImageProps) {
    const resolved: ImageProps['src'] =
        typeof src === 'string' ? toPublicUrl(src) : src
    return (
        <NextImage
            {...props}
            src={resolved}
            unoptimized={unoptimized ?? isAlreadyOptimized(resolveSrcUrl(resolved))}
        />
    )
}
