import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import ConfirmStripeSession from './ConfirmStripeSession'

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: { session_id?: string }
}) {
    const { userId } = await auth()
    const sessionId = searchParams.session_id

    if (!sessionId) {
        return (
            <div className='container mx-auto px-4 py-8'>
                <div className='max-w-md mx-auto text-center'>
                    <h1 className='text-2xl font-bold text-red-600 mb-4'>
                        Invalid Session
                    </h1>
                    <p className='text-gray-600 mb-6'>
                        No session ID was provided. Please check your email for
                        download links.
                    </p>
                    <a
                        href='/'
                        className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
                    >
                        Return Home
                    </a>
                </div>
            </div>
        )
    }

    console.log(
        'Processing success page for session:',
        sessionId,
        userId ? `user: ${userId}` : '(anonymous)',
    )

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='max-w-md mx-auto text-center'>
                <h1 className='text-2xl font-bold text-green-600 mb-4'>
                    Processing Your Order...
                </h1>
                <p className='text-gray-600 mb-6'>
                    Please wait while we confirm your payment and prepare your
                    downloads.
                </p>

                <Suspense
                    fallback={
                        <div className='flex items-center justify-center'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                            <span className='ml-2'>Confirming payment...</span>
                        </div>
                    }
                >
                    <ConfirmStripeSession
                        sessionId={sessionId}
                        userId={userId ?? null}
                    />
                </Suspense>
            </div>
        </div>
    )
}
