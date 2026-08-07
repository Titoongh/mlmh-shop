import type { ComponentProps } from 'react'
import type { SignIn } from '@clerk/nextjs'

type Appearance = NonNullable<ComponentProps<typeof SignIn>['appearance']>

// Shared Clerk appearance matching the site's neobrutalist theme
// (colors from tailwind.config.ts: purple-dark, white-oldlace).
export const clerkAppearance: Appearance = {
    variables: {
        colorPrimary: '#4C00FF',
        colorBackground: '#FEF2E8',
        colorForeground: '#000000',
        colorInput: '#FFFFFF',
        borderRadius: '6px',
    },
    elements: {
        cardBox: 'border-2 border-black shadow-base rounded-md',
        formButtonPrimary:
            'bg-purple-dark text-white font-bold border-2 border-black shadow-small hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-base transition-all',
        footerActionLink: 'text-purple-dark font-semibold hover:underline',
    },
}
