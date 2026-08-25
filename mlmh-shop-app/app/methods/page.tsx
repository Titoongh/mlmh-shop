import { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/app/components/JsonLd'
import MethodCard from '@/app/components/MethodCard'
import { getVisibleMethods } from '@/lib/db/methods'
import { breadcrumbSchema, SITE_NAME } from '@/lib/seo'

// Hub SSG régénéré par revalidateMethods() (lib/db/revalidate.ts) + fenêtre ISR.
export const revalidate = 86400

const PAGE_DESCRIPTION =
    'Complete guitar methods by Michel Lelong: PDF tablatures and audio ' +
    'lessons covering fingerpicking, country blues, Travis picking and more. ' +
    'Buy the full package, the PDF booklet or single lessons.'

export const metadata: Metadata = {
    title: 'Guitar Methods',
    description: PAGE_DESCRIPTION,
    keywords: [
        'guitar method',
        'guitar methods',
        'fingerpicking method',
        'travis picking',
        'guitar lessons pdf',
        'audio guitar lessons',
        'Michel Lelong',
    ].join(', '),
    alternates: {
        canonical: '/methods',
    },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title: 'Guitar Methods',
        description: PAGE_DESCRIPTION,
        url: '/methods',
    },
}

export default async function MethodsPage() {
    const methods = await getVisibleMethods()

    const jsonLd = [
        breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Methods', path: '/methods' },
        ]),
    ]

    return (
        // Colonne unique obligatoire : le layout racine pose {children} dans un
        // conteneur `flex` (row) ; des enfants multiples se placeraient côte à côte.
        <div className='w-full flex flex-col bg-white'>
            <JsonLd data={jsonLd} />
            <div className='w-full max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8'>
                <nav
                    aria-label='Breadcrumb'
                    className='text-sm text-gray-600'
                >
                    <ol className='flex flex-wrap items-center gap-1'>
                        <li>
                            <Link href='/' className='hover:underline'>
                                Home
                            </Link>
                            <span className='px-1'>/</span>
                        </li>
                        <li aria-current='page' className='text-black'>
                            Methods
                        </li>
                    </ol>
                </nav>

                <header className='flex flex-col gap-3'>
                    <h1 className='text-4xl font-bold'>Guitar Methods</h1>
                    <p className='text-gray-600 max-w-3xl'>
                        Complete methods written and taught by Michel Lelong:
                        each one comes with PDF tablatures and recorded
                        lessons. Buy the complete package, the PDF booklet
                        alone, or pick single lessons.
                    </p>
                    <p className='text-sm text-gray-500'>
                        {methods.length} method{methods.length !== 1 ? 's' : ''}{' '}
                        available
                    </p>
                </header>

                {methods.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                        {methods.map((method, index) => (
                            <MethodCard
                                key={method.id}
                                method={method}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='border-2 border-dashed border-black rounded-md p-12 text-center text-gray-500'>
                        No methods available yet. Check back soon!
                    </div>
                )}
            </div>
        </div>
    )
}
