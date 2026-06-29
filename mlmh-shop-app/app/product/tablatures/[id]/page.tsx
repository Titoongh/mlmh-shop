import { getTablatureProduct } from './lib/data'
import ProductClient from '@/app/product/tablatures/[id]/ProductClient'
import { Metadata } from 'next'
import { prisma } from '@/app/prisma'
import JsonLd from '@/app/components/JsonLd'
import {
    absoluteImageUrl,
    absoluteUrl,
    breadcrumbSchema,
    productSchema,
} from '@/lib/seo'

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
            select: { id: true },
            where: { hidden: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        return tablatures.map(tablature => ({
            id: tablature.id,
        }))
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
        title,
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
            canonical: `/product/tablatures/${params.id}`,
        },
        openGraph: {
            type: 'website',
            title,
            description,
            url: `/product/tablatures/${params.id}`,
            ...(previewImage
                ? {
                      images: [
                          {
                              url: previewImage,
                              alt: product.title,
                              width: 1200,
                              height: 630,
                          },
                      ],
                  }
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

    const artist = product.artists[0]
    const path = `/product/tablatures/${product.id}`
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
                ? [{ name: artist.name, path: `/artists/${artist.id}` }]
                : []),
            { name: product.title, path },
        ]),
    ]

    // Pass the fetched data to the client component
    return (
        <>
            <JsonLd data={jsonLd} />
            <ProductClient product={product} shareUrl={absoluteUrl(path)} />
        </>
    )
}

export default ProductPage
