'use client'

import {
    OrganizationProfile,
    OrganizationSwitcher,
    SignedIn,
    SignedOut,
    SignInButton,
} from '@clerk/nextjs'

export default function OrganizationsPage() {
    return (
        <div className='w-full min-h-full flex flex-col items-center bg-white-oldlace p-10'>
            <SignedIn>
                <div className='flex flex-col items-center gap-8 w-full max-w-4xl'>
                    <h1 className='text-4xl font-bold text-purple-dark mb-6'>
                        Organization Management
                    </h1>

                    <div className='w-full bg-white rounded-lg border-2 border-black shadow-base p-6'>
                        <h2 className='text-2xl font-semibold text-purple-dark mb-4'>
                            Switch Organizations
                        </h2>
                        <p className='text-gray-700 mb-4'>
                            Use the organization switcher below to switch
                            between your personal account and organizations
                            you&apos;re part of.
                        </p>
                        <div className='flex justify-center'>
                            <OrganizationSwitcher
                                afterCreateOrganizationUrl='/organizations'
                                afterSelectOrganizationUrl='/organizations'
                                afterLeaveOrganizationUrl='/organizations'
                                createOrganizationMode='modal'
                                organizationProfileMode='modal'
                                appearance={{
                                    elements: {
                                        organizationSwitcherTrigger:
                                            'border-2 border-purple-dark bg-purple-light text-black hover:bg-purple-medium transition-colors px-4 py-2 rounded',
                                        organizationSwitcherPopoverCard:
                                            'border-2 border-purple-dark shadow-base',
                                        organizationSwitcherPopoverFooter:
                                            'hidden',
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className='w-full bg-white rounded-lg border-2 border-black shadow-base p-6'>
                        <h2 className='text-2xl font-semibold text-purple-dark mb-4'>
                            Organization Profile
                        </h2>
                        <p className='text-gray-700 mb-4'>
                            Manage your current organization settings, members,
                            and permissions.
                        </p>
                        <OrganizationProfile
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'border-2 border-purple-dark shadow-base',
                                },
                            }}
                        />
                    </div>
                </div>
            </SignedIn>

            <SignedOut>
                <div className='text-center'>
                    <h1 className='text-4xl font-bold text-purple-dark mb-6'>
                        Please Sign In
                    </h1>
                    <p className='text-gray-700 mb-6'>
                        You need to be signed in to access organization
                        features.
                    </p>
                    <SignInButton>
                        <button className='border-2 border-purple-dark bg-purple-light text-black hover:bg-purple-medium transition-colors px-6 py-3 rounded font-semibold'>
                            Sign In
                        </button>
                    </SignInButton>
                </div>
            </SignedOut>
        </div>
    )
}
