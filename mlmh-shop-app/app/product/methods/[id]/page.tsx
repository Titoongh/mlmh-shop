import { getMethodProduct } from './lib/data'
import MethodProductClient from './ProductClient'
import { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { prisma } from '@/app/prisma'
import JsonLd from '@/app/components/JsonLd'
import { TablatureCard } from '@/app/components/ArtistViews'
import MethodCard from '@/app/components/MethodCard'
import { getArtistById } from '@/lib/db/artists'
import { getRelatedMethods } from '@/lib/db/methods'
import {
    absoluteImageUrl,
    absoluteUrl,
    breadcrumbSchema,
    productSchema,
    SITE_NAME,
} from '@/lib/seo'
import { artistPath, isUuid, methodPath } from '@/lib/slug'

interface ProductParams {
    id: string
}

interface ProductPageProps {
    params: Promise<ProductParams>
}

// The method catalog is small: prerender every visible method.
export async function generateStaticParams(): Promise<ProductParams[]> {
    try {
        const methods = await prisma.method.findMany({
            select: { slug: true },
            where: { hidden: false },
            orderBy: { createdAt: 'desc' },
        })

        return methods.map(method => ({ id: method.slug }))
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

export async function generateMetadata(
    props: ProductPageProps,
): Promise<Metadata> {
    const params = await props.params
    const product = await getMethodProduct(params.id)

    const artistName = product.artists[0]?.name
    const genreNames = product.musicalGenres?.map(g => g.name) ?? []
    const path = methodPath(product) // canonical slug URL
    const title = `${product.title} - Guitar Method`
    const description =
        product.description ||
        `${product.title}: a complete guitar method by Michel Lelong. ` +
            'Download PDF tablatures and audio lessons.'

    const firstImageContent = product.contents.find(
        content => content.type === 'IMAGE' && content.url,
    )
    const artistImageContent = product.artists[0]?.contents.find(
        content => content.type === 'IMAGE' && content.url,
    )
    // Absolute URL so social scrapers can fetch it. When the method has no image
    // we OMIT the field entirely so the site-wide default opengraph-image is used
    // (setting images: [] would suppress that fallback).
    const previewImage = absoluteImageUrl(
        firstImageContent?.url || artistImageContent?.url,
    )

    return {
        // Concise (<60 chars) so Google doesn't truncate; keeps the
        // "guitar method" keyword instead of the site-name suffix.
        title: { absolute: `${product.title} - guitar method` },
        description,
        keywords: [
            product.title,
            artistName,
            `${product.title} guitar method`,
            ...genreNames,
            ...genreNames.map(g => `${g} guitar method`),
            'guitar method',
            'guitar lessons',
            'guitar tablature',
            'fingerpicking',
        ]
            .filter(Boolean)
            .join(', '),
        alternates: {
            canonical: path,
        },
        openGraph: {
            type: 'website',
            siteName: SITE_NAME,
            title,
            description,
            url: path,
            ...(previewImage
                ? { images: [{ url: previewImage, alt: product.title }] }
                : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(previewImage ? { images: [previewImage] } : {}),
        },
    }
}

const MethodProductPage = async (props: ProductPageProps) => {
    const params = await props.params
    const product = await getMethodProduct(params.id)

    // UUID URL → 301 to the canonical slug URL.
    if (isUuid(params.id)) {
        permanentRedirect(methodPath(product))
    }

    const artist = product.artists[0]
    const path = methodPath(product)

    // Maillage interne (SEO) : autres volumes (même artiste) + tabs de
    // l'artiste, rendus côté serveur pour être visibles des crawlers.
    const relatedMethods = await getRelatedMethods(
        product.id,
        product.artists.map(a => a.id),
        6,
    )
    const fullArtist = artist ? await getArtistById(artist.slug) : null
    const artistTablatures =
        fullArtist?.tablatures.filter(tab => !tab.hidden).slice(0, 6) ?? []

    const productImage = absoluteImageUrl(
        product.contents.find(c => c.type === 'IMAGE' && c.url)?.url ||
            artist?.contents.find(c => c.type === 'IMAGE' && c.url)?.url,
    )

    const offerPrices = product.offers.map(offer => offer.price)
    const lowPrice = offerPrices.length ? Math.min(...offerPrices) : 0
    const highPrice = offerPrices.length ? Math.max(...offerPrices) : 0

    const jsonLd: object[] = [
        productSchema({
            name: product.title,
            description:
                product.description ||
                `${product.title}: a complete guitar method by Michel Lelong.`,
            image: productImage,
            path,
            price: lowPrice,
            artistName: artist?.name,
            sku: product.id,
            inStock: true,
            genres: product.musicalGenres?.map(g => g.name),
            category: 'Guitar method',
            ...(offerPrices.length > 1
                ? {
                      priceRange: {
                          low: lowPrice,
                          high: highPrice,
                          count: offerPrices.length,
                      },
                  }
                : {}),
        }),
        breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Methods', path: '/methods' },
            { name: product.title, path },
        ]),
    ]

    return (
        <>
            {/* Explicit preload for the LCP image (see tablature page for the
                rationale: next/image priority inside a client component doesn't
                reliably inject the preload link). */}
            {productImage && (
                <link
                    rel='preload'
                    as='image'
                    href={productImage}
                    fetchPriority='high'
                />
            )}
            <JsonLd data={jsonLd} />
            {/* Colonne unique obligatoire : le layout racine pose {children} dans
                un conteneur `flex` (row) ; des enfants multiples se placeraient
                côte à côte. */}
            <div className='w-full flex flex-col bg-white'>
                {/* Fil d'Ariane HTML (liens crawlables), cohérent avec le JSON-LD
                BreadcrumbList ci-dessus. */}
                <nav
                    aria-label='Breadcrumb'
                    className='w-full max-w-[1200px] mx-auto px-6 pt-6 text-sm text-gray-600'
                >
                    <ol className='flex flex-wrap items-center gap-1'>
                        <li>
                            <Link href='/' className='hover:underline'>
                                Home
                            </Link>
                            <span className='px-1'>/</span>
                        </li>
                        <li>
                            <Link href='/methods' className='hover:underline'>
                                Methods
                            </Link>
                            <span className='px-1'>/</span>
                        </li>
                        <li aria-current='page' className='text-black'>
                            {product.title}
                        </li>
                    </ol>
                </nav>
                <MethodProductClient
                    product={product}
                    shareUrl={absoluteUrl(path)}
                />
                {(relatedMethods.length > 0 || artistTablatures.length > 0) && (
                    <div className='w-full max-w-[1200px] mx-auto px-6 pb-12 flex flex-col gap-10'>
                        {relatedMethods.length > 0 && (
                            <section>
                                <h2 className='text-2xl font-semibold mb-6'>
                                    Related methods
                                </h2>
                                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                                    {relatedMethods.map(method => (
                                        <MethodCard
                                            key={method.id}
                                            method={method}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                        {artistTablatures.length > 0 && fullArtist && (
                            <section>
                                <h2 className='text-2xl font-semibold mb-6'>
                                    Tabs by {fullArtist.name}
                                </h2>
                                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                                    {artistTablatures.map(tab => (
                                        <TablatureCard
                                            key={tab.id}
                                            tablature={tab}
                                            artist={fullArtist}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default MethodProductPage
