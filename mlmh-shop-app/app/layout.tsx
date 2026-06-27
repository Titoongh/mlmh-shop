// import './polyfills'
import './globals.css'
import type { Metadata } from 'next'
import { Public_Sans } from 'next/font/google'
import Footer from './components/Footer'
import HeaderClient from './components/HeaderClient'
import { ClerkProvider } from '@clerk/nextjs'

const public_sans = Public_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Michel Lelong Guitar Tab Workshop',
    description:
        'Discover a vast collection of guitar tablatures, methods, and video lessons from Michel Lelong, designed for guitar enthusiasts of all levels.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider>
            <html lang='en'>
                <head>
                    <meta
                        name='viewport'
                        content='width=device-width, initial-scale=1'
                    />
                    <title>Michel Lelong Guitar Tab Workshop</title>
                </head>
                <body
                    className={`${public_sans.className} min-h-screen flex flex-col`}
                >
                    <HeaderClient />
                    <div className='flex flex-grow'>{children}</div>
                    <Footer />
                </body>
            </html>
        </ClerkProvider>
    )
}
