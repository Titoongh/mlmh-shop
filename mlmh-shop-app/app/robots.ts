import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Allows crawling of the public catalogue; blocks API, auth-gated and transactional
// routes that carry no SEO value. Points crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/dashboard',
                '/checkout',
                '/user/',
                '/organizations',
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
