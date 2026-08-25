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
        founder: { '@type': 'Person', name: 'Michel Lelong' },
    }
}

// External authoritative references for entity consolidation (sameAs). These help
// Google's Knowledge Graph — and the LLMs that read it — recognise Michel Lelong as a
// real entity. NB: verify the Facebook/YouTube handles before relying on them.
export const MICHEL_LELONG_SAME_AS = [
    'https://www.michel-lelong-music-house.com/en/biography/',
    'https://www.thecountryblues.com/articles/michel-lelong-one-of-the-primary-blues-preservationists-in-france/',
    'https://www.facebook.com/MichelLelongsMusicHouse',
    'https://www.youtube.com/@lelong6strings',
]

// Person node for Michel Lelong. knowsAbout lists his areas of expertise so search
// engines/LLMs can surface him for "how to learn blues guitar"-type questions.
export function personSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Michel Lelong',
        url: absoluteUrl('/about'),
        jobTitle: 'Guitarist, guitar teacher and music transcriber',
        description:
            'French acoustic guitarist and teacher (born 1961, Tours) specialised in ' +
            'American traditional music: country blues, fingerpicking, ragtime, ' +
            'bluegrass, folk, old-time and Celtic guitar. Author of the reference ' +
            'method "La guitare blues acoustique" and of transcription books for ' +
            "Stefan Grossman's Guitar Workshop.",
        knowsAbout: [
            'Country blues guitar',
            'Fingerpicking',
            'Travis picking',
            'Ragtime guitar',
            'Bluegrass',
            'Folk guitar',
            'Old-time music',
            'Celtic guitar',
            'Acoustic blues',
            'Guitar tablature',
        ],
        image: absoluteUrl('/apple-touch-icon.png'),
        sameAs: MICHEL_LELONG_SAME_AS,
        worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
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
    genres?: string[] | undefined
    category?: string | undefined // defaults to 'Guitar tablature'
    // Multi-offer products (methods): emits an AggregateOffer instead of a
    // single Offer. `price` is then unused.
    priceRange?:
        | { low: number; high: number; count: number }
        | undefined
}

// Product + Offer. Eligible for price-bearing rich results. Currency is EUR to match
// the real Stripe charge (see app/api/checkout-v2) and the on-page price.
export function productSchema(input: ProductSchemaInput) {
    const availability =
        input.inStock === false
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock'

    const offers = input.priceRange
        ? {
              '@type': 'AggregateOffer',
              url: absoluteUrl(input.path),
              lowPrice: input.priceRange.low.toFixed(2),
              highPrice: input.priceRange.high.toFixed(2),
              offerCount: input.priceRange.count,
              priceCurrency: 'EUR',
              availability,
              seller: { '@type': 'Organization', name: SITE_NAME },
          }
        : {
              '@type': 'Offer',
              url: absoluteUrl(input.path),
              price: input.price.toFixed(2),
              priceCurrency: 'EUR',
              availability,
              seller: { '@type': 'Organization', name: SITE_NAME },
          }

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: input.name,
        description: input.description,
        ...(input.image ? { image: input.image } : {}),
        sku: input.sku,
        category: input.category ?? 'Guitar tablature',
        ...(input.genres && input.genres.length
            ? { genre: input.genres }
            : {}),
        ...(input.artistName
            ? { brand: { '@type': 'Brand', name: input.artistName } }
            : {}),
        offers,
    }
}

export interface MusicGroupSchemaInput {
    name: string
    description?: string | undefined
    image?: string | undefined
    path: string
    genres?: string[] | undefined
}

export function musicGroupSchema(input: MusicGroupSchemaInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'MusicGroup',
        name: input.name,
        url: absoluteUrl(input.path),
        ...(input.description ? { description: input.description } : {}),
        ...(input.image ? { image: input.image } : {}),
        ...(input.genres && input.genres.length
            ? { genre: input.genres }
            : {}),
    }
}
