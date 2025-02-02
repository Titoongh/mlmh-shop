'use client'
import React from 'react'

export default function Conditions() {
    return (
        <main className='max-w-4xl mx-auto px-4 py-8'>
            <h1 className='text-3xl font-bold mb-4'>
                Terms of Service and Privacy Policy
            </h1>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>Introduction</h2>
                <p>
                    Welcome to{' '}
                    <a
                        href='https://mlmh.gobc.fr'
                        className='text-blue-500 underline'
                    >
                        https://mlmh.gobc.fr
                    </a>{' '}
                    (hereinafter, &quot;the Site&quot;). By accessing or using
                    our Site, you agree to be bound by these Terms of Service
                    and the Privacy Policy outlined below.
                </p>
            </section>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>
                    Services Provided
                </h2>
                <p>
                    The Site offers for sale downloadable guitar tablatures,
                    guitar methods, and video as well as audio lessons. All
                    content—including tablatures, instructional methods, and
                    lessons—is created exclusively by the MLMH team.
                </p>
            </section>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>
                    Use of Personal Information
                </h2>
                <p>
                    For authentication via OAuth with Google, we only use the
                    public information provided by your Google account, which
                    includes your email address and profile data. No additional
                    personal information is collected, stored, or used.
                </p>
            </section>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>
                    Intellectual Property
                </h2>
                <p>
                    All content on the Site, including but not limited to
                    tablatures, instructional methods, lessons, and related
                    educational materials, is protected by copyright and other
                    intellectual property rights owned by MLMH.
                </p>
            </section>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>Permitted Use</h2>
                <p>
                    You are authorized to use the content on the Site solely for
                    personal purposes. Any reproduction, modification,
                    distribution, or commercial exploitation of the content
                    without explicit permission is strictly prohibited.
                </p>
            </section>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>Modifications</h2>
                <p>
                    We reserve the right to update or modify these Terms of
                    Service and our Privacy Policy at any time. Such
                    modifications will take effect immediately upon publication
                    on this page. By continuing to use the Site after any
                    changes, you agree to the updated terms.
                </p>
            </section>

            <section className='mb-6'>
                <h2 className='text-2xl font-semibold mb-2'>
                    Contact Information
                </h2>
                <p>
                    If you have any questions, concerns, or requests regarding
                    these Terms of Service or our Privacy Policy, please contact
                    us at:{' '}
                    <a
                        href='mailto:contact@mlmh.gobc.fr'
                        className='text-blue-500 underline'
                    >
                        contact@mlmh.gobc.fr
                    </a>
                    .
                </p>
            </section>
        </main>
    )
}
