import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import ConfirmStripeSession from './ConfirmStripeSession'
import Link from 'next/link'

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: { session_id?: string }
}) {
    const { userId } = await auth()
    const sessionId = searchParams.session_id

    return (
        <main className='w-full min-h-[70vh] bg-white-oldlace flex items-center justify-center px-4 py-16'>
            <div className='w-full max-w-md bg-white border-2 border-black rounded-md shadow-base p-10 text-center'>
                {!sessionId ? (
                    <>
                        <div className='w-16 h-16 rounded-full bg-red/10 border-2 border-red flex items-center justify-center mx-auto mb-6'>
                            <svg className='w-8 h-8 text-red' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </div>
                        <h1 className='text-2xl font-bold mb-2'>Invalid session</h1>
                        <p className='text-gray-500 text-sm mb-6'>
                            No session ID found. Check your email for your download link.
                        </p>
                        <Link
                            href='/'
                            className='inline-block bg-purple-dark text-white font-bold px-6 py-3 rounded-md border-2 border-black shadow-base hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all'
                        >
                            Return to shop
                        </Link>
                    </>
                ) : (
                    <Suspense
                        fallback={
                            <div className='flex flex-col items-center gap-6'>
                                <div className='w-16 h-16 rounded-full border-4 border-orange-khaki border-t-transparent animate-spin' />
                                <p className='text-lg font-medium'>Confirming your payment…</p>
                            </div>
                        }
                    >
                        <ConfirmStripeSession
                            sessionId={sessionId}
                            userId={userId ?? null}
                        />
                    </Suspense>
                )}
            </div>
        </main>
    )
}
