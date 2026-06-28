import { prisma } from '@/app/prisma'
import { canDownloadSession } from '@/services/purchase-verification'
import Link from 'next/link'

export const metadata = { robots: { index: false, follow: false } }

export default async function GuestDownloadPage(
    props: {
        searchParams: Promise<{ session_id?: string }>
    }
) {
    const searchParams = await props.searchParams;
    const sessionId = searchParams.session_id

    if (!sessionId) {
        return (
            <main className='w-full min-h-[70vh] bg-white-oldlace flex items-center justify-center px-4 py-16'>
                <div className='w-full max-w-md bg-white border-2 border-black rounded-md shadow-base p-10 text-center space-y-6'>
                    <div className='w-16 h-16 rounded-full bg-red-salmon/10 border-2 border-red-salmon flex items-center justify-center mx-auto'>
                        <svg className='w-8 h-8 text-red-salmon' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold mb-2'>Invalid link</h1>
                        <p className='text-gray-500 text-sm'>
                            This download link is not valid. Check your email for the correct link.
                        </p>
                    </div>
                    <Link
                        href='/'
                        className='inline-block bg-purple-dark text-white font-bold px-6 py-3 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                    >
                        Browse tablatures
                    </Link>
                </div>
            </main>
        )
    }

    const permission = await canDownloadSession(sessionId)

    if (!permission.canDownload) {
        return (
            <main className='w-full min-h-[70vh] bg-white-oldlace flex items-center justify-center px-4 py-16'>
                <div className='w-full max-w-md bg-white border-2 border-black rounded-md shadow-base p-10 text-center space-y-6'>
                    <div className='w-16 h-16 rounded-full bg-red-salmon/10 border-2 border-red-salmon flex items-center justify-center mx-auto'>
                        <svg className='w-8 h-8 text-red-salmon' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold mb-2'>Link unavailable</h1>
                        <p className='text-gray-500 text-sm'>
                            {permission.reason || 'This download link is no longer valid.'}
                        </p>
                    </div>
                    <Link
                        href='/'
                        className='inline-block bg-purple-dark text-white font-bold px-6 py-3 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                    >
                        Browse tablatures
                    </Link>
                </div>
            </main>
        )
    }

    const tablatures = permission.tablatureIds?.length
        ? await prisma.tablature.findMany({
              where: { id: { in: permission.tablatureIds } },
              include: { artists: true },
          })
        : []

    return (
        <main className='w-full min-h-[70vh] bg-white-oldlace flex items-center justify-center px-4 py-16'>
            <div className='w-full max-w-lg space-y-4'>
                {/* Download card */}
                <div className='bg-white border-2 border-black rounded-md shadow-base p-8 space-y-6'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 rounded-full bg-purple-dark border-2 border-black flex items-center justify-center flex-shrink-0 shadow-small'>
                            <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                            </svg>
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold leading-tight'>Your files are ready</h1>
                            <p className='text-gray-500 text-sm mt-0.5'>
                                {tablatures.length} tablature{tablatures.length !== 1 ? 's' : ''} purchased
                            </p>
                        </div>
                    </div>

                    {/* Tablature list */}
                    {tablatures.length > 0 && (
                        <ul className='divide-y divide-gray-100 border border-gray-100 rounded-md overflow-hidden'>
                            {tablatures.map(tab => (
                                <li key={tab.id} className='flex items-center gap-3 px-4 py-3 bg-white-oldlace/40'>
                                    <div className='w-8 h-8 rounded bg-orange-khaki border border-black flex items-center justify-center flex-shrink-0'>
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' />
                                        </svg>
                                    </div>
                                    <div className='min-w-0'>
                                        <p className='font-semibold text-sm truncate'>{tab.title}</p>
                                        <p className='text-gray-500 text-xs truncate'>
                                            {tab.artists.map(a => a.name).join(', ')}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <a
                        href={`/api/download-v2?session_id=${sessionId}`}
                        className='flex items-center justify-center gap-2 w-full bg-purple-dark text-white font-bold px-8 py-4 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
                        download
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                        </svg>
                        Download all files (.zip)
                    </a>
                </div>

                {/* CTA card */}
                <div className='bg-orange-khaki border-2 border-black rounded-md shadow-base p-6 flex items-center justify-between gap-4'>
                    <div>
                        <p className='font-bold'>Want more tabs?</p>
                        <p className='text-sm text-gray-700 mt-0.5'>Browse our full catalogue of guitar tablatures.</p>
                    </div>
                    <Link
                        href='/search'
                        className='flex-shrink-0 bg-white font-bold px-5 py-2.5 rounded-md border-2 border-black shadow-small hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-base active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-sm'
                    >
                        Browse →
                    </Link>
                </div>
            </div>
        </main>
    )
}
