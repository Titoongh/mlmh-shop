'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PickerOption } from './types'

interface EntityPickerProps {
    label: string
    options: PickerOption[]
    selected: string[]
    onChange: (ids: string[]) => void
    required?: boolean
    emptyHint?: string
}

// Liste de cases à cocher avec recherche — plus lisible qu'un <select multiple>
// pour choisir les artistes/genres d'une tablature.
export default function EntityPicker({
    label,
    options,
    selected,
    onChange,
    required,
    emptyHint,
}: EntityPickerProps) {
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return options
        return options.filter(o => o.name.toLowerCase().includes(q))
    }, [options, query])

    const toggle = (id: string) => {
        onChange(
            selected.includes(id)
                ? selected.filter(s => s !== id)
                : [...selected, id],
        )
    }

    return (
        <div>
            <label className='block mb-2 text-sm font-medium'>
                {label}
                {required && ' *'}
            </label>
            {options.length > 6 && (
                <input
                    type='text'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder='Rechercher…'
                    className='w-full px-4 py-2 mb-2 border-2 border-black rounded'
                />
            )}
            <div className='max-h-52 overflow-y-auto border-2 border-black rounded p-2 space-y-1 bg-white'>
                {filtered.length === 0 && (
                    <p className='text-sm text-gray-500 px-2 py-1'>
                        {options.length === 0
                            ? emptyHint || 'Aucun élément disponible.'
                            : 'Aucun résultat pour cette recherche.'}
                    </p>
                )}
                {filtered.map(option => (
                    <label
                        key={option.id}
                        className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-purple-light',
                            selected.includes(option.id) && 'bg-purple-light',
                        )}
                    >
                        <input
                            type='checkbox'
                            checked={selected.includes(option.id)}
                            onChange={() => toggle(option.id)}
                        />
                        <span className='text-sm'>{option.name}</span>
                    </label>
                ))}
            </div>
            {selected.length > 0 && (
                <p className='mt-1 text-xs text-gray-600'>
                    {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
                </p>
            )}
        </div>
    )
}
