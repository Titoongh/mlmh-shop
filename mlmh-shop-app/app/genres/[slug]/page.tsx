import { ArtistCard, TablatureCard } from '@/app/components/ArtistViews'
import JsonLd from '@/app/components/JsonLd'
import type { TablatureWithMusicalGenres } from '@/app/types/types'
import {
    getGenresWithArtists,
    type GenreWithCatalog,
} from '@/lib/db/musical-genres'
import { breadcrumbSchema, SITE_NAME } from '@/lib/seo'
import { genrePath } from '@/lib/slug'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface GenreParams {
    slug: string
}

interface GenrePageProps {
    params: Promise<GenreParams>
}

// Pré-génère les genres ayant au moins un artiste visible ; revalidation par tags
// ('musical-genres'/'artists'/'tablatures') + fallback quotidien, comme les autres pages.
export async function generateStaticParams(): Promise<GenreParams[]> {
    const genres = await getGenresWithArtists()
    return genres.filter(g => g.artists.length > 0).map(g => ({ slug: g.slug }))
}

export const revalidate = 86400

async function getGenre(slug: string): Promise<GenreWithCatalog | null> {
    const genres = await getGenresWithArtists()
    return genres.find(g => g.slug === slug && g.artists.length > 0) ?? null
}

// Tablatures du genre, dérivées des tablatures (visibles) de ses artistes visibles.
// NB : une tablature taguée du genre dont AUCUN artiste ne porte le genre ne
// remonterait pas ici ; en pratique l'upload tague artiste et tablature ensemble.
function genreTablatures(genre: GenreWithCatalog): Array<{
    tablature: TablatureWithMusicalGenres
    artist: GenreWithCatalog['artists'][number]
}> {
    const seen = new Set<string>()
    const result: Array<{
        tablature: TablatureWithMusicalGenres
        artist: GenreWithCatalog['artists'][number]
    }> = []
    for (const artist of genre.artists) {
        for (const tablature of artist.tablatures) {
            if (seen.has(tablature.id)) continue
            if (!tablature.musicalGenres.some(g => g.id === genre.id)) continue
            seen.add(tablature.id)
            result.push({ tablature, artist })
        }
    }
    return result
}

function displayName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

export async function generateMetadata(
    props: GenrePageProps,
): Promise<Metadata> {
    const { slug } = await props.params
    const genre = await getGenre(slug)

    if (!genre) {
        return { title: 'Genre not found' }
    }

    const tabCount = genreTablatures(genre).length
    const path = genrePath(genre)
    const title = `${displayName(genre.name)} guitar tablatures & artists`
    const description =
        `Discover ${genre.artists.length} ${genre.name} artist` +
        `${genre.artists.length !== 1 ? 's' : ''} and ${tabCount} ` +
        `high-quality handwritten guitar tablature${tabCount !== 1 ? 's' : ''} to download.`

    return {
        title: { absolute: title },
        description,
        keywords: [
            genre.name,
            `${genre.name} guitar tablature`,
            `${genre.name} guitar tabs`,
            ...genre.artists.map(a => a.name),
            'guitar tablature',
            'guitar tabs',
        ].join(', '),
        alternates: { canonical: path },
        openGraph: {
            siteName: SITE_NAME,
            title,
            description,
            url: path,
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
    }
}

export default async function GenrePage(props: GenrePageProps) {
    const { slug } = await props.params
    const genre = await getGenre(slug)

    if (!genre) notFound()

    const tablatures = genreTablatures(genre)
    const path = genrePath(genre)

    const jsonLd: object[] = [
        breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: displayName(genre.name), path },
        ]),
    ]

    return (
        <div className='w-full min-h-full flex flex-col gap-10 p-6 md:p-10 bg-white-oldlace'>
            <JsonLd data={jsonLd} />
            <div className='w-full mt-8'>
                <h1 className='text-3xl font-bold'>
                    {displayName(genre.name)} guitar tablatures
                </h1>
                <p className='text-gray-600 mt-2'>
                    {genre.artists.length} artist
                    {genre.artists.length !== 1 ? 's' : ''} and{' '}
                    {tablatures.length} tablature
                    {tablatures.length !== 1 ? 's' : ''} in this genre.
                </p>
            </div>
            <section className='w-full'>
                <h2 className='text-2xl font-semibold mb-6'>Artists</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {genre.artists.map((artist, index) => (
                        <ArtistCard
                            key={artist.id}
                            artist={artist}
                            index={index}
                        />
                    ))}
                </div>
            </section>
            {tablatures.length > 0 && (
                <section className='w-full'>
                    <h2 className='text-2xl font-semibold mb-6'>Tablatures</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                        {tablatures.map(({ tablature, artist }) => (
                            <TablatureCard
                                key={tablature.id}
                                tablature={tablature}
                                artist={artist}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
