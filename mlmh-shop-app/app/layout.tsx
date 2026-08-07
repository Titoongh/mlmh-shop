// import './polyfills'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Public_Sans } from 'next/font/google'
import Footer from './components/Footer'
import HeaderClient from './components/HeaderClient'
import JsonLd from './components/JsonLd'
import { ClerkProvider } from '@clerk/nextjs'
import {
    SITE_URL,
    SITE_NAME,
    SITE_DESCRIPTION,
    organizationSchema,
    websiteSchema,
} from '@/lib/seo'

const public_sans = Public_Sans({ subsets: ['latin'] })

// metadataBase makes every relative canonical/OG URL in child pages resolve to an
// absolute URL on the canonical origin. title.template wraps page titles as
// "<page> | Michel Lelong Guitar Tab Workshop". Per-page canonicals are set in each
// page's generateMetadata (NOT here) so pages never wrongly inherit the home URL.
export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
        'guitar tablature',
        'guitar tabs',
        'tablatures',
        'handwritten tablature',
        'guitar method',
        'guitar lessons',
        'Michel Lelong',
    ],
    authors: [{ name: 'Michel Lelong' }],
    creator: 'Michel Lelong',
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider signInUrl='/sign-in' signUpUrl='/sign-up'>
            <html lang='en'>
                <body
                    className={`${public_sans.className} min-h-screen flex flex-col`}
                >
                    {/* Site-wide structured data: brand + search box. */}
                    <JsonLd data={[organizationSchema(), websiteSchema()]} />
                    <HeaderClient />
                    <div className='flex flex-grow'>{children}</div>
                    <Footer />
                </body>
            </html>
        </ClerkProvider>
    )
}
