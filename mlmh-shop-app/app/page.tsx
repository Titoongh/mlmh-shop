import React from 'react'
import HomePageServer from './components/HomePageServer'

// Page statique : recommandations lues via lib/db (unstable_cache + tags).
// - Revalidation par tag 'tablatures' à chaque upload/modif (lib/db/revalidate).
// - Fallback temporel quotidien au cas où aucun tag ne serait invalidé.
export const revalidate = 86400

export default function Home() {
    return <HomePageServer />
}
