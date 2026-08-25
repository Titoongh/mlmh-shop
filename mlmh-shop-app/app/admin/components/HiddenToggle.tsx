'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    setArtistHiddenAction,
    setMethodHiddenAction,
    setTablatureHiddenAction,
} from '@/lib/actions/admin'
import { cn } from '@/lib/utils'

interface HiddenToggleProps {
    kind: 'tablature' | 'artist' | 'method'
    id: string
    hidden: boolean
}

// Bouton Masquer/Afficher des listes admin. Le masquage remplace la
// suppression : l'élément disparaît du site mais reste en base (ventes liées).
export default function HiddenToggle({ kind, id, hidden }: HiddenToggleProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const toggle = () => {
        setError(null)
        startTransition(async () => {
            const action =
                kind === 'tablature'
                    ? setTablatureHiddenAction
                    : kind === 'method'
                      ? setMethodHiddenAction
                      : setArtistHiddenAction
            const result = await action(id, !hidden)
            if ('error' in result) {
                setError(result.error)
                return
            }
            router.refresh()
        })
    }

    return (
        <div className='flex flex-col items-start gap-1'>
            <button
                type='button'
                onClick={toggle}
                disabled={isPending}
                title={
                    hidden
                        ? 'Rendre visible sur le site'
                        : 'Masquer du site (réversible)'
                }
                className={cn(
                    'px-3 py-1 text-sm rounded-full border-2 font-medium transition-colors',
                    isPending && 'opacity-50 cursor-wait',
                    hidden
                        ? 'border-green-darkcyan bg-white hover:bg-green'
                        : 'border-black bg-white hover:bg-red-salmon',
                )}
            >
                {isPending ? '…' : hidden ? 'Afficher' : 'Masquer'}
            </button>
            {error && <span className='text-xs text-red-600'>{error}</span>}
        </div>
    )
}
