// Centralised SEO helpers: canonical site URL, absolute URL/image resolution and
// JSON-LD (schema.org) builders. Imported by metadata exports, the sitemap, robots
// and the <JsonLd /> component. Keep this the single source of truth for anything
// that needs the public origin so canonical/OG/sitemap URLs never drift.

// Public origin. Driven by NEXT_PUBLIC_SITE_URL in every environment; falls back to
// the production domain so prerendered output is always absolute even if the env var
// is missing. Trailing slash stripped so `${SITE_URL}${path}` is always well-formed.
export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://michel-lelong-guitar-tab-workshop.com'
).replace(/\/+$/, '')

export const SITE_NAME = 'Michel Lelong Guitar Tab Workshop'

export const SITE_DESCRIPTION =
    'Discover a vast collection of guitar tablatures, methods, and video lessons ' +
    'from Michel Lelong, designed for guitarists of all levels.'

// Storage path prefixes that map to the public image bucket. Mirrors SmartImage's
// toPublicUrl() so OG/JSON-LD images resolve to the SAME absolute URL the page renders.
const STORAGE_PREFIXES = ['/public/storage/', '/public/uploads/', '/api/static/']

// Turn a path (or already-absolute URL) into an absolute URL on the canonical origin.
export function absoluteUrl(path = '/'): string {
    if (/^https?:\/\//i.test(path)) return path
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

// Resolve a stored image reference (storage path, bare key or absolute URL) to an
// absolute URL usable by crawlers/social scrapers (which can't resolve relative paths).
export function absoluteImageUrl(src?: string | null): string | undefined {
    if (!src) return undefined
    if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src
    const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? ''
    for (const prefix of STORAGE_PREFIXES) {
        if (src.startsWith(prefix)) return `${base}/${src.slice(prefix.length)}`
    }
    if (src.startsWith('/')) return absoluteUrl(src) // local asset under /public
    return base ? `${base}/${src}` : absoluteUrl(`/${src}`)
}

// ---------------------------------------------------------------------------
// JSON-LD (schema.org) builders. Each returns a plain object rendered by <JsonLd />.
// ---------------------------------------------------------------------------

// Brand/Organization. Used site-wide (rendered once in the root layout).
export function organizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/apple-touch-icon.png'),
        description: SITE_DESCRIPTION,
    }
}

// WebSite node + Sitelinks Search Box. Lets Google wire a search box into results.
export function websiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }
}

export interface BreadcrumbItem {
    name: string
    path: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    }
}

export interface ProductSchemaInput {
    name: string
    description: string
    image?: string | undefined // absolute URL preferred
    path: string
    price: number
    artistName?: string | undefined
    sku: string
    inStock?: boolean | undefined
}

// Product + Offer. Eligible for price-bearing rich results. Currency is EUR to match
// the real Stripe charge (see app/api/checkout-v2) and the on-page price.
export function productSchema(input: ProductSchemaInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: input.name,
        description: input.description,
        ...(input.image ? { image: input.image } : {}),
        sku: input.sku,
        category: 'Guitar tablature',
        ...(input.artistName
            ? { brand: { '@type': 'Brand', name: input.artistName } }
            : {}),
        offers: {
            '@type': 'Offer',
            url: absoluteUrl(input.path),
            price: input.price.toFixed(2),
            priceCurrency: 'EUR',
            availability:
                input.inStock === false
                    ? 'https://schema.org/OutOfStock'
                    : 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: SITE_NAME },
        },
    }
}

export interface MusicGroupSchemaInput {
    name: string
    description?: string | undefined
    image?: string | undefined
    path: string
}

export function musicGroupSchema(input: MusicGroupSchemaInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'MusicGroup',
        name: input.name,
        url: absoluteUrl(input.path),
        ...(input.description ? { description: input.description } : {}),
        ...(input.image ? { image: input.image } : {}),
    }
}
