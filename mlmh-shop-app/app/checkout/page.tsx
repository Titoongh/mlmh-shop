import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import CheckoutClient from './components/CheckoutClient'

interface CheckoutPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CheckoutPage({
    searchParams,
}: CheckoutPageProps) {
    const params = new URLSearchParams()

    // Handle search params properly
    Object.entries(searchParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
            params.set(key, value)
        } else if (Array.isArray(value)) {
            params.set(key, value[0] || '')
        }
    })

    const isSuccess = params.get('success') === 'true'
    const sessionId = params.get('session_id')
    const isCanceled = params.get('canceled') === 'true'

    // If success page without session_id, redirect to cart
    if (isSuccess && !sessionId) {
        redirect('/checkout')
    }

    return (
        <div className='flex flex-col items-center justify-center w-full min-h-full p-10 bg-white-oldlace'>
            <div className='h-full flex flex-col justify-center items-center w-full max-w-[1000px] gap-6'>
                <Suspense fallback={<div>Loading...</div>}>
                    <CheckoutClient
                        isSuccess={isSuccess}
                        sessionId={sessionId}
                        isCanceled={isCanceled}
                    />
                </Suspense>
            </div>
        </div>
    )
}
