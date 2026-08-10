import Link from 'next/link'
import { getHomeRecommendations } from '@/lib/db/tablatures'
import { getSearchArtists } from '@/lib/db/artists'
import { artistPath } from '@/lib/slug'
import HomePageClient from './HomePageClient'

export default async function HomePageServer() {
    const [recommendations, artists] = await Promise.all([
        getHomeRecommendations(),
        getSearchArtists(),
    ])

    const sortedArtists = [...artists].sort((a, b) =>
        a.name.localeCompare(b.name),
    )

    return (
        // Colonne unique obligatoire : le layout racine pose {children} dans un
        // conteneur `flex` (row) ; des enfants multiples se placeraient côte à côte.
        <div className='w-full flex flex-col'>
            <HomePageClient initialRecommendations={recommendations} />
            {/* Liens serveur vers toutes les pages artistes : maillage interne SEO
                (le reste de la home ne référence que des tablatures). */}
            {sortedArtists.length > 0 && (
                <section className='w-full bg-white-oldlace'>
                    <div className='max-w-7xl mx-auto px-6 pb-12'>
                        <h2 className='text-3xl font-bold text-purple-dark mb-6'>
                            Browse artists
                        </h2>
                        <div className='flex flex-wrap gap-2'>
                            {sortedArtists.map(artist => (
                                <Link
                                    key={artist.id}
                                    href={artistPath(artist)}
                                    className='px-3 py-1 text-sm rounded-full border-2 border-black bg-white hover:bg-purple-light/20 transition-colors'
                                >
                                    {artist.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
