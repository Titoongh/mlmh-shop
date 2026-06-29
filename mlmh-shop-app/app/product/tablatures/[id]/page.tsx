import { getTablatureProduct } from './lib/data'
import ProductClient from '@/app/product/tablatures/[id]/ProductClient'
import { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { prisma } from '@/app/prisma'
import JsonLd from '@/app/components/JsonLd'
import {
    absoluteImageUrl,
    absoluteUrl,
    breadcrumbSchema,
    productSchema,
    SITE_NAME,
} from '@/lib/seo'
import { artistPath, isUuid, tablaturePath } from '@/lib/slug'

interface ProductParams {
    id: string
}

interface ProductPageProps {
    params: Promise<ProductParams>
}

// Generate static paths for most popular products (optional - for performance optimization)
export async function generateStaticParams(): Promise<ProductParams[]> {
    try {
        // Get the most recent 20 tablatures for static generation
        // You can modify this query based on your business logic (e.g., most popular, featured, etc.)
        const tablatures = await prisma.tablature.findMany({
            select: { slug: true },
            where: { hidden: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        // Prerender the slug URL.
        return tablatures.map(tablature => ({ id: tablature.slug }))
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

// Generate metadata for SEO optimization
export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
    const params = await props.params
    const product = await getTablatureProduct(params.id)

    const artistName = product.artists[0]?.name || 'Unknown Artist'
    const genreNames = product.musicalGenres?.map(g => g.name) ?? []
    const path = tablaturePath(product) // canonical slug URL
    const title = `${product.title} - ${artistName}`
    const description =
        product.description ||
        `Tablature for ${product.title} by ${artistName}. Download high-quality handwritten guitar tablatures.`

    const firstImageContent = product.contents.find(
        content => content.type === 'IMAGE' && content.url,
    )
    const artistImageContent = product.artists[0]?.contents.find(
        content => content.type === 'IMAGE' && content.url,
    )
    // Absolute URL so social scrapers can fetch it. When the tablature has no image
    // we OMIT the field entirely so the site-wide default opengraph-image is used
    // (setting images: [] would suppress that fallback).
    const previewImage = absoluteImageUrl(
        firstImageContent?.url || artistImageContent?.url,
    )

    return {
        // Concise (<60 chars) so Google doesn't truncate; keeps the "guitar tab"
        // keyword instead of the long site-name suffix from the title template.
        title: { absolute: `${product.title} – ${artistName} guitar tab` },
        description,
        keywords: [
            product.title,
            artistName,
            `${product.title} tab`,
            `${product.title} guitar tablature`,
            ...genreNames,
            ...genreNames.map(g => `${g} guitar tablature`),
            'guitar tablature',
            'guitar tabs',
            'music sheets',
            'handwritten tablature',
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
            // No width/height: the real image dimensions vary, so declaring a fixed
            // 1200x630 was wrong. Let platforms detect the actual size.
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

// Server component that fetches data and renders the client component
const ProductPage = async (props: ProductPageProps) => {
    const params = await props.params
    // Fetch data on the server with caching
    const product = await getTablatureProduct(params.id)

    // Legacy UUID URL → 301 to the canonical slug URL.
    if (isUuid(params.id)) {
        permanentRedirect(tablaturePath(product))
    }

    const artist = product.artists[0]
    const path = tablaturePath(product)
    const productImage = absoluteImageUrl(
        product.contents.find(c => c.type === 'IMAGE' && c.url)?.url ||
            artist?.contents.find(c => c.type === 'IMAGE' && c.url)?.url,
    )

    const jsonLd: object[] = [
        productSchema({
            name: product.title,
            description:
                product.description ||
                `Tablature for ${product.title} by ${
                    artist?.name || 'Unknown Artist'
                }.`,
            image: productImage,
            path,
            price: product.price,
            artistName: artist?.name,
            sku: product.id,
            inStock: true,
            genres: product.musicalGenres?.map(g => g.name),
        }),
        breadcrumbSchema([
            { name: 'Home', path: '/' },
            ...(artist
                ? [{ name: artist.name, path: artistPath(artist) }]
                : []),
            { name: product.title, path },
        ]),
    ]

    // Pass the fetched data to the client component
    return (
        <>
            {/* Explicit preload for the LCP image — next/image priority inside a
                client component doesn't reliably inject <link rel="preload"> in
                the <head>; doing it here from the server component guarantees
                early discovery before the body parses. URL must match the src
                SmartImage resolves to (direct S3 URL for webp). */}
            {productImage && (
                <link rel="preload" as="image" href={productImage} fetchPriority="high" />
            )}
            <JsonLd data={jsonLd} />
            <ProductClient product={product} shareUrl={absoluteUrl(path)} />
        </>
    )
}

export default ProductPage
