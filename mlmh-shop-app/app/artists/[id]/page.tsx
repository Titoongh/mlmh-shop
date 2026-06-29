import UpdateButton from '@/app/components/adminButtons'
import { TablatureCard } from '@/app/components/ArtistViews'
import SmartImage from '@/app/components/SmartImage'
import ShareButton from '@/app/components/ShareButton'
import JsonLd from '@/app/components/JsonLd'
import { getArtistById, getVisibleArtistSlugs } from '@/lib/db/artists'
import {
    absoluteImageUrl,
    absoluteUrl,
    breadcrumbSchema,
    musicGroupSchema,
} from '@/lib/seo'
import { artistPath, isUuid } from '@/lib/slug'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

interface ArtistParams {
    id: string
}

interface ArtistPageProps {
    params: Promise<ArtistParams>
}

// Pré-génère les artistes visibles ; les autres sont rendus à la demande puis
// cachés (dynamicParams par défaut). Revalidation par tag `artist:${id}` sur
// modif back-office + fallback quotidien.
export async function generateStaticParams(): Promise<ArtistParams[]> {
    const slugs = await getVisibleArtistSlugs()
    return slugs.map(id => ({ id }))
}

export const revalidate = 86400

export async function generateMetadata(
    props: ArtistPageProps,
): Promise<Metadata> {
    const { id } = await props.params
    const artist = await getArtistById(id)

    if (!artist) {
        return { title: 'Artist not found' }
    }

    const tabCount = artist.tablatures.length
    const genreNames = artist.musicalGenres?.map(g => g.name) ?? []
    const genrePart = genreNames.length ? ` (${genreNames.join(', ')})` : ''
    const description =
        artist.description ||
        `Discover ${tabCount} guitar tablature${
            tabCount !== 1 ? 's' : ''
        } by ${artist.name}${genrePart}. High-quality handwritten guitar tabs to download.`
    const image = absoluteImageUrl(artist.contents?.[0]?.url)
    const path = artistPath(artist)

    return {
        title: `${artist.name} — Guitar tablatures`,
        description,
        keywords: [
            artist.name,
            `${artist.name} guitar tab`,
            `${artist.name} tablature`,
            ...genreNames,
            ...genreNames.map(g => `${g} guitar tablature`),
            'guitar tablature',
            'guitar tabs',
        ].join(', '),
        alternates: { canonical: path },
        openGraph: {
            type: 'profile',
            title: `${artist.name} — Guitar tablatures`,
            description,
            url: path,
            ...(image
                ? {
                      images: [
                          {
                              url: image,
                              alt: artist.name,
                              width: 1200,
                              height: 630,
                          },
                      ],
                  }
                : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title: `${artist.name} — Guitar tablatures`,
            description,
            ...(image ? { images: [image] } : {}),
        },
    }
}

export default async function ArtistPage(props: ArtistPageProps) {
    const { id } = await props.params
    const artist = await getArtistById(id)

    if (!artist) notFound()

    // Legacy UUID URL → 301 to the canonical slug URL.
    if (isUuid(id) && artist.slug) {
        permanentRedirect(artistPath(artist))
    }

    const path = artistPath(artist)
    const image = absoluteImageUrl(artist.contents?.[0]?.url)

    const jsonLd: object[] = [
        musicGroupSchema({
            name: artist.name,
            description: artist.description || undefined,
            image,
            path,
            genres: artist.musicalGenres?.map(g => g.name),
        }),
        breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: artist.name, path },
        ]),
    ]

    return (
        <div className='w-full min-h-full flex flex-col gap-8 p-6 md:p-10 bg-white-oldlace'>
            <JsonLd data={jsonLd} />
            <div className='w-full bg-purple-light/10 rounded-lg mt-8'>
                <div className='flex gap-6 flex-col md:flex-row'>
                    <div className='relative w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0'>
                        {artist.contents?.[0]?.url && (
                            <SmartImage
                                src={artist.contents[0].url}
                                alt={artist.name}
                                fill
                                sizes='(min-width: 768px) 192px, 100vw'
                                className='object-cover w-full h-full'
                                priority
                            />
                        )}
                    </div>
                    <div className='flex flex-col flex-grow gap-4'>
                        <div className='flex justify-start items-center gap-4'>
                            <h1 className='text-3xl font-bold'>{artist.name}</h1>
                            <UpdateButton
                                href={`/dashboard?id=${artist.id}&type=artist&mode=update`}
                            />
                        </div>
                        <p className='text-gray-600'>
                            {artist.description || 'No description available'}
                        </p>
                        <div className='mt-auto flex flex-wrap items-end justify-between gap-4'>
                            <span className='text-purple-dark font-medium'>
                                {artist.tablatures.length} tablature
                                {artist.tablatures.length !== 1 ? 's' : ''}{' '}
                                available
                            </span>
                            <ShareButton
                                url={absoluteUrl(path)}
                                title={`${artist.name} — guitar tablatures`}
                                message={`🎸 Discover ${artist.name}'s guitar tablatures on Michel Lelong Guitar Tab Workshop`}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className='w-full mt-10'>
                <h2 className='text-2xl font-semibold mb-6'>Tablatures</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {artist.tablatures.map(tab => (
                        <TablatureCard
                            key={tab.id}
                            tablature={tab}
                            artist={artist}
                            showLetterOverlay={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
