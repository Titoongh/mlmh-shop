import type { MetadataRoute } from 'next'
import { prisma } from '@/app/prisma'
import { SITE_URL } from '@/lib/seo'
import { artistPath, genrePath, tablaturePath } from '@/lib/slug'

// force-dynamic: computed at request time so it never needs the DB at build and is
// always up to date with the latest visible tablatures/artists (crawlers hit it rarely).
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
        { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
        {
            url: `${SITE_URL}/conditions`,
            changeFrequency: 'yearly',
            priority: 0.2,
        },
    ]

    try {
        const [tablatures, artists, genres] = await Promise.all([
            prisma.tablature.findMany({
                where: { hidden: false },
                select: { id: true, slug: true, updatedAt: true },
            }),
            prisma.artist.findMany({
                where: { hidden: false },
                select: { id: true, slug: true, updatedAt: true },
            }),
            // Seulement les genres qui ont une page (au moins un artiste visible),
            // sinon le sitemap pointerait vers des 404.
            prisma.musicalGenre.findMany({
                where: { artists: { some: { hidden: false } } },
                select: { id: true, name: true },
            }),
        ])

        return [
            ...staticRoutes,
            ...tablatures.map(
                (t): MetadataRoute.Sitemap[number] => ({
                    url: `${SITE_URL}${tablaturePath(t)}`,
                    lastModified: t.updatedAt,
                    changeFrequency: 'weekly',
                    priority: 0.7,
                }),
            ),
            ...artists.map(
                (a): MetadataRoute.Sitemap[number] => ({
                    url: `${SITE_URL}${artistPath(a)}`,
                    lastModified: a.updatedAt,
                    changeFrequency: 'weekly',
                    priority: 0.6,
                }),
            ),
            ...genres.map(
                (g): MetadataRoute.Sitemap[number] => ({
                    url: `${SITE_URL}${genrePath(g)}`,
                    changeFrequency: 'weekly',
                    priority: 0.6,
                }),
            ),
        ]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return staticRoutes
    }
}
