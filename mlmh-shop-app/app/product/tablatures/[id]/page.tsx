import { getTablatureProduct } from './lib/data'
import ProductClient from '@/app/components/ProductClient'
import { Metadata } from 'next'
import { prisma } from '@/app/prisma'

interface ProductParams {
    id: string
}

interface ProductPageProps {
    params: ProductParams
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
export async function generateMetadata({
    params,
}: ProductPageProps): Promise<Metadata> {
    const product = await getTablatureProduct(params.id)

    const firstImageContent = product.contents.find(
        content => content.type === 'IMAGE' && content.url,
    )
    const artistImageContent = product.artists[0]?.contents.find(
        content => content.type === 'IMAGE' && content.url,
    )
    const previewImage = firstImageContent?.url || artistImageContent?.url

    return {
        title: `${product.title} - ${
            product.artists[0]?.name || 'Unknown Artist'
        }`,
        description:
            product.description ||
            `Tablature for ${product.title} by ${
                product.artists[0]?.name || 'Unknown Artist'
            }. Download high-quality handwritten guitar tablatures.`,
        keywords: [
            product.title,
            product.artists[0]?.name || '',
            'guitar tablature',
            'guitar tabs',
            'music sheets',
            'handwritten tablature',
        ]
            .filter(Boolean)
            .join(', '),
        openGraph: {
            title: `${product.title} - ${
                product.artists[0]?.name || 'Unknown Artist'
            }`,
            description:
                product.description || `Tablature for ${product.title}`,
            type: 'website',
            images: previewImage
                ? [
                      {
                          url: previewImage,
                          alt: product.title,
                          width: 1200,
                          height: 630,
                      },
                  ]
                : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${product.title} - ${
                product.artists[0]?.name || 'Unknown Artist'
            }`,
            description:
                product.description || `Tablature for ${product.title}`,
            images: previewImage ? [previewImage] : [],
        },
        alternates: {
            canonical: `/product/tablatures/${params.id}`,
        },
    }
}

// Server component that fetches data and renders the client component
const ProductPage = async ({ params }: ProductPageProps) => {
    // Fetch data on the server with caching
    const product = await getTablatureProduct(params.id)

    // Pass the fetched data to the client component
    return <ProductClient product={product} />
}

export default ProductPage
