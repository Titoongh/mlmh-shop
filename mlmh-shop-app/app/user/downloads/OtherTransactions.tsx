'use client'

import { useState } from 'react'
import type { PurchaseHistoryItem } from '@/services/purchase-verification'

type Item = PurchaseHistoryItem

interface Purchase {
    id: string
    status: string
    createdAt: Date
    totalAmount: number
    currency: string
    items: Item[]
}

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

export default function OtherTransactions({ purchases }: { purchases: Purchase[] }) {
    const [open, setOpen] = useState(false)

    if (purchases.length === 0) return null

    return (
        <div className='mt-8'>
            <button
                onClick={() => setOpen(o => !o)}
                className='flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors'
            >
                <svg
                    className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
                    fill='none' stroke='currentColor' viewBox='0 0 24 24'
                >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                </svg>
                {purchases.length} pending or failed {purchases.length === 1 ? 'transaction' : 'transactions'}
            </button>

            {open && (
                <div className='mt-3 space-y-3'>
                    {purchases.map(purchase => (
                        <article
                            key={purchase.id}
                            className='bg-white/60 border border-gray-200 rounded-md overflow-hidden opacity-70'
                        >
                            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
                                <div className='flex items-center gap-2'>
                                    <span className='font-mono text-xs text-gray-400'>
                                        #{purchase.id.slice(-8).toUpperCase()}
                                    </span>
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                            purchase.status === 'PENDING'
                                                ? 'bg-yellow-khaki/30 text-yellow-600 border-yellow-600'
                                                : 'bg-red/20 text-red border-red'
                                        }`}
                                    >
                                        {purchase.status}
                                    </span>
                                </div>
                                <div className='text-right'>
                                    <p className='text-xs text-gray-400'>{formatDate(purchase.createdAt)}</p>
                                    <p className='text-sm font-medium'>{formatAmount(purchase.totalAmount, purchase.currency)}</p>
                                </div>
                            </div>
                            <ul className='divide-y divide-gray-50'>
                                {purchase.items.map((item, index) => (
                                    <li key={index} className='flex items-center justify-between px-4 py-2.5'>
                                        {item.type === 'tablature' ? (
                                            <div>
                                                <p className='text-sm text-gray-600'>{item.tablatureTitle}</p>
                                                <p className='text-xs text-gray-400'>by {item.artistName}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className='text-sm text-gray-600'>{item.methodTitle}</p>
                                                <p className='text-xs text-gray-400'>
                                                    {item.offerTitle}
                                                    {item.lessonTitle ? ` - ${item.lessonTitle}` : ''}
                                                </p>
                                            </div>
                                        )}
                                        <p className='text-xs text-gray-400 tabular-nums'>
                                            {formatAmount(item.priceAtPurchase, purchase.currency)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
