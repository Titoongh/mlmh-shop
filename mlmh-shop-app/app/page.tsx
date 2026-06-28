import React from 'react'
import type { Metadata } from 'next'
import HomePageServer from './components/HomePageServer'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo'

// Page statique : recommandations lues via lib/db (unstable_cache + tags).
// - Revalidation par tag 'tablatures' à chaque upload/modif (lib/db/revalidate).
// - Fallback temporel quotidien au cas où aucun tag ne serait invalidé.
export const revalidate = 86400

export const metadata: Metadata = {
    title: { absolute: SITE_NAME },
    description: SITE_DESCRIPTION,
    alternates: { canonical: '/' },
    openGraph: { url: '/', title: SITE_NAME, description: SITE_DESCRIPTION },
}

export default function Home() {
    return <HomePageServer />
}
