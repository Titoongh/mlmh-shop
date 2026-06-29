import type { MetadataRoute } from 'next'
import { prisma } from '@/app/prisma'
import { SITE_URL } from '@/lib/seo'

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
        const [tablatures, artists] = await Promise.all([
            prisma.tablature.findMany({
                where: { hidden: false },
                select: { id: true, updatedAt: true },
            }),
            prisma.artist.findMany({
                where: { hidden: false },
                select: { id: true, updatedAt: true },
            }),
        ])

        return [
            ...staticRoutes,
            ...tablatures.map(
                (t): MetadataRoute.Sitemap[number] => ({
                    url: `${SITE_URL}/product/tablatures/${t.id}`,
                    lastModified: t.updatedAt,
                    changeFrequency: 'weekly',
                    priority: 0.7,
                }),
            ),
            ...artists.map(
                (a): MetadataRoute.Sitemap[number] => ({
                    url: `${SITE_URL}/artists/${a.id}`,
                    lastModified: a.updatedAt,
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
