import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// EUR to match the actual Stripe charge (see app/api/checkout-v2). en-IE renders a
// leading € symbol with English formatting, e.g. "€5.00".
export function formatPrice(price: number) {
    return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
    }).format(price)
}
