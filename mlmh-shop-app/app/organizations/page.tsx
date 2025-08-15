'use client'

import { OrganizationSwitcher, useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function OrganizationsPage() {
    const { has, isLoaded } = useAuth()
    const isAdmin = has?.({ role: 'org:admin' })

    useEffect(() => {
        if (isLoaded && !isAdmin) {
            redirect('/')
        }
    }, [isLoaded, isAdmin])

    if (!isLoaded) {
        return (
            <div className='min-h-screen bg-black flex items-center justify-center'>
                <div className='text-white'>Loading...</div>
            </div>
        )
    }

    if (!isAdmin) {
        return null
    }

    return (
        <div className='min-h-screen bg-black text-white'>
            <div className='container mx-auto px-4 py-8'>
                <div className='max-w-4xl mx-auto'>
                    <h1 className='text-3xl font-bold mb-8 text-center'>
                        Organization Management
                    </h1>

                    <div className='bg-gray-900 rounded-lg p-8 border border-orange-khaki'>
                        <h2 className='text-xl font-semibold mb-6'>
                            Switch Organization
                        </h2>
                        <p className='text-gray-300 mb-6'>
                            Select the organization you want to manage, or
                            create a new one.
                        </p>

                        <div className='flex justify-center'>
                            <OrganizationSwitcher
                                afterCreateOrganizationUrl='/dashboard'
                                afterSelectOrganizationUrl='/dashboard'
                                afterLeaveOrganizationUrl='/dashboard'
                                createOrganizationMode='modal'
                                organizationProfileMode='modal'
                                appearance={{
                                    elements: {
                                        organizationSwitcherTrigger:
                                            'bg-orange-khaki text-black hover:bg-orange-khaki/80 transition-colors px-6 py-3 rounded-lg font-medium',
                                        organizationSwitcherPopoverCard:
                                            'bg-black border border-orange-khaki',
                                        organizationSwitcherPopoverFooter:
                                            'hidden',
                                        organizationPreview: 'text-white',
                                        organizationSwitcherPreviewButton:
                                            'text-white hover:text-orange-khaki',
                                    },
                                }}
                            />
                        </div>

                        <div className='mt-8 pt-8 border-t border-gray-700'>
                            <h3 className='text-lg font-semibold mb-4'>
                                Organization Features
                            </h3>
                            <ul className='space-y-2 text-gray-300'>
                                <li>
                                    • Switch between different organizations
                                </li>
                                <li>• Create new organizations</li>
                                <li>
                                    • Manage organization settings and members
                                </li>
                                <li>
                                    • Access organization-specific dashboard
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
