import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserPurchaseHistory } from '@/services/purchase-verification'
import DownloadButton from './DownloadButton'

export default async function UserDownloadsPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in?redirect_url=/user/downloads')
    }

    const purchaseHistory = await getUserPurchaseHistory()

    if (!purchaseHistory.success) {
        return (
            <div className='container mx-auto px-4 py-8'>
                <div className='max-w-4xl mx-auto'>
                    <h1 className='text-3xl font-bold mb-8'>Your Downloads</h1>
                    <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
                        <h2 className='text-lg font-semibold text-red-800 mb-2'>
                            Error Loading Downloads
                        </h2>
                        <p className='text-red-600'>{purchaseHistory.error}</p>
                    </div>
                </div>
            </div>
        )
    }

    const purchases = purchaseHistory.purchases || []

    if (purchases.length === 0) {
        return (
            <div className='container mx-auto px-4 py-8'>
                <div className='max-w-4xl mx-auto'>
                    <h1 className='text-3xl font-bold mb-8'>Your Downloads</h1>
                    <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
                        <h2 className='text-xl font-semibold text-gray-700 mb-4'>
                            No Purchases Yet
                        </h2>
                        <p className='text-gray-600 mb-6'>
                            You have not purchased any tablatures yet. Browse
                            our collection to get started!
                        </p>
                        <a
                            href='/'
                            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            Browse Tablatures
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='text-3xl font-bold mb-8'>Your Downloads</h1>

                <div className='space-y-6'>
                    {purchases.map(purchase => (
                        <div
                            key={purchase.id}
                            className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'
                        >
                            <div className='flex justify-between items-start mb-4'>
                                <div>
                                    <div className='flex items-center gap-3 mb-2'>
                                        <h2 className='text-lg font-semibold'>
                                            Purchase #{purchase.id.slice(-8)}
                                        </h2>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                purchase.status === 'PAID'
                                                    ? 'bg-green-100 text-green-800'
                                                    : purchase.status ===
                                                      'PENDING'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {purchase.status}
                                        </span>
                                    </div>
                                    <p className='text-sm text-gray-600'>
                                        {new Date(
                                            purchase.createdAt,
                                        ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                    <p className='text-sm font-medium text-gray-900'>
                                        Total: $
                                        {(purchase.totalAmount / 100).toFixed(
                                            2,
                                        )}{' '}
                                        {purchase.currency.toUpperCase()}
                                    </p>
                                </div>

                                {purchase.status === 'PAID' && (
                                    <DownloadButton
                                        tablatureIds={purchase.items.map(
                                            item => item.tablatureId,
                                        )}
                                        purchaseId={purchase.id}
                                    />
                                )}
                            </div>

                            <div className='space-y-3'>
                                <h3 className='font-medium text-gray-900'>
                                    Items:
                                </h3>
                                {purchase.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className='flex justify-between items-center bg-gray-50 rounded p-3'
                                    >
                                        <div>
                                            <h4 className='font-medium text-gray-900'>
                                                {item.tablatureTitle}
                                            </h4>
                                            <p className='text-sm text-gray-600'>
                                                by {item.artistName}
                                            </p>
                                        </div>
                                        <div className='text-sm font-medium text-gray-900'>
                                            $
                                            {(
                                                item.priceAtPurchase / 100
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className='mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <h3 className='font-medium text-blue-900 mb-2'>
                        Need Help?
                    </h3>
                    <p className='text-sm text-blue-700'>
                        If you are having trouble downloading your purchases,
                        please check your email for the download links or
                        contact our support team.
                    </p>
                </div>
            </div>
        </div>
    )
}
