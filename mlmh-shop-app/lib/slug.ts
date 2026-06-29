// URL slug helpers. A slug is a lowercase, ASCII, hyphenated form of a title/name
// used in public URLs (e.g. "Sweet Home Alabama" → "sweet-home-alabama"). Slugs are
// generated once at creation and must stay STABLE afterwards so indexed URLs and 301
// redirects don't break.

export function slugify(input: string): string {
    const base = input
        .normalize('NFKD') // split accented chars into base + diacritic
        .replace(/[̀-ͯ]/g, '') // drop diacritics
        .replace(/[''`]/g, '') // drop apostrophes (don't → dont)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics → hyphen
        .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
        .slice(0, 80)
        .replace(/-+$/g, '') // re-trim after slice
    return base || 'untitled'
}

// Matches a v4-style UUID (the legacy id format). Used to tell whether a URL segment
// is an old UUID (→ redirect to the slug) or already a slug.
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
    return UUID_RE.test(value)
}

// Canonical public paths. Prefer the slug; fall back to the id when a row hasn't been
// backfilled yet (pre-seed safety) so links never break.
export function tablaturePath(t: { slug?: string | null; id: string }): string {
    return `/product/tablatures/${t.slug ?? t.id}`
}

export function artistPath(a: { slug?: string | null; id: string }): string {
    return `/artists/${a.slug ?? a.id}`
}

// Returns a slug derived from `base` that is unique according to `exists`. Tries the
// plain slug first, then appends -2, -3, … until a free one is found.
export async function generateUniqueSlug(
    base: string,
    exists: (slug: string) => Promise<boolean>,
): Promise<string> {
    const root = slugify(base)
    let candidate = root
    let n = 1
    // Cap the loop so a pathological case can't spin forever; fall back to a suffix.
    while (n < 1000 && (await exists(candidate))) {
        n += 1
        candidate = `${root}-${n}`
    }
    return candidate
}
