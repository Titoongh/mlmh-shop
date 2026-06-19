import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserPurchaseHistory } from '@/services/purchase-verification'
import DownloadButton from './DownloadButton'
import OtherTransactions from './OtherTransactions'
import Link from 'next/link'

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100)
}

export default async function UserDownloadsPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in?redirect_url=/user/downloads')
    }

    const purchaseHistory = await getUserPurchaseHistory()

    if (!purchaseHistory.success) {
        return (
            <main className='w-full min-h-screen bg-white-oldlace px-4 py-12'>
                <div className='max-w-3xl mx-auto'>
                    <h1 className='text-4xl font-bold mb-8'>My Library</h1>
                    <div className='bg-red/10 border-2 border-red rounded-md p-6 shadow-small'>
                        <p className='font-semibold text-red mb-1'>Error loading downloads</p>
                        <p className='text-sm text-gray-600'>{purchaseHistory.error}</p>
                    </div>
                </div>
            </main>
        )
    }

    const allPurchases = purchaseHistory.purchases || []
    const paidPurchases = allPurchases.filter(p => p.status === 'PAID')
    const otherPurchases = allPurchases.filter(p => p.status !== 'PAID')

    if (paidPurchases.length === 0 && otherPurchases.length === 0) {
        return (
            <main className='w-full min-h-screen bg-white-oldlace px-4 py-12'>
                <div className='max-w-3xl mx-auto'>
                    <h1 className='text-4xl font-bold mb-2'>My Library</h1>
                    <p className='text-gray-500 mb-12'>Your purchased tablatures will appear here.</p>

                    <div className='border-2 border-dashed border-black rounded-md p-12 text-center'>
                        <div className='w-16 h-16 rounded-full bg-purple-light border-2 border-black flex items-center justify-center mx-auto mb-6'>
                            <svg className='w-8 h-8 text-purple-dark' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' />
                            </svg>
                        </div>
                        <h2 className='text-xl font-bold mb-2'>Your library is empty</h2>
                        <p className='text-gray-500 mb-6 text-sm'>You haven&apos;t purchased any tablatures yet.</p>
                        <Link
                            href='/search'
                            className='inline-flex items-center gap-2 bg-purple-dark text-white font-bold px-6 py-3 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                        >
                            Browse the shop
                        </Link>
                    </div>

                    <OtherTransactions purchases={otherPurchases} />
                </div>
            </main>
        )
    }

    return (
        <main className='w-full min-h-screen bg-white-oldlace px-4 py-12'>
            <div className='max-w-3xl mx-auto'>
                <div className='flex items-end justify-between mb-2'>
                    <h1 className='text-4xl font-bold'>My Library</h1>
                    <span className='text-sm text-gray-500 mb-1'>
                        {paidPurchases.length} {paidPurchases.length === 1 ? 'purchase' : 'purchases'}
                    </span>
                </div>
                <p className='text-gray-500 mb-10'>All your purchased tablatures, ready to download.</p>

                <div className='space-y-4'>
                    {paidPurchases.map(purchase => (
                        <article
                            key={purchase.id}
                            className='bg-white border-2 border-black rounded-md shadow-base overflow-hidden'
                        >
                            <div className='flex items-center justify-between px-5 py-4 border-b-2 border-black bg-black/[0.03]'>
                                <div className='flex items-center gap-3'>
                                    <span className='font-mono text-xs text-gray-400 select-all'>
                                        #{purchase.id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                <div className='flex items-center gap-4'>
                                    <div className='text-right'>
                                        <p className='text-xs text-gray-400'>{formatDate(purchase.createdAt)}</p>
                                        <p className='text-sm font-bold'>{formatAmount(purchase.totalAmount, purchase.currency)}</p>
                                    </div>
                                    <DownloadButton
                                        tablatureIds={purchase.items.map(item => item.tablatureId)}
                                        purchaseId={purchase.id}
                                    />
                                </div>
                            </div>

                            <ul className='divide-y divide-gray-100'>
                                {purchase.items.map((item, index) => (
                                    <li key={index} className='flex items-center justify-between px-5 py-3'>
                                        <div>
                                            <p className='font-semibold text-sm'>{item.tablatureTitle}</p>
                                            <p className='text-xs text-gray-400'>by {item.artistName}</p>
                                        </div>
                                        <p className='text-sm font-medium tabular-nums'>
                                            {formatAmount(item.priceAtPurchase, purchase.currency)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>

                <OtherTransactions purchases={otherPurchases} />

                <div className='mt-10 flex items-start gap-3 p-4 bg-orange-khaki/20 border border-orange-khaki rounded-md text-sm'>
                    <svg className='w-5 h-5 text-orange shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <p className='text-gray-700'>
                        Having trouble downloading? Check your email for download links or contact support.
                    </p>
                </div>
            </div>
        </main>
    )
}
