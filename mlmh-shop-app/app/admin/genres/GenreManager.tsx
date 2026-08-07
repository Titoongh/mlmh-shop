'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    createGenreAction,
    deleteGenreAction,
    renameGenreAction,
    type ActionResult,
} from '@/lib/actions/admin'

interface GenreRow {
    id: string
    name: string
    artistCount: number
    tablatureCount: number
}

// CRUD inline des genres. La suppression utilise une confirmation en deux
// clics (pas de window.confirm) et affiche ce que le genre délierait.
export default function GenreManager({ genres }: { genres: GenreRow[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')

    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
        null,
    )

    const run = (fn: () => Promise<ActionResult>) => {
        setError('')
        startTransition(async () => {
            const result = await fn()
            if ('error' in result) {
                setError(result.error)
                return
            }
            setEditingId(null)
            setConfirmingDeleteId(null)
            router.refresh()
        })
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        const name = newName.trim()
        if (!name) return
        run(async () => {
            const result = await createGenreAction(name)
            if (!('error' in result)) setNewName('')
            return result
        })
    }

    return (
        <div className='max-w-2xl space-y-6'>
            {error && (
                <div className='px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded'>
                    {error}
                </div>
            )}

            <form onSubmit={handleCreate} className='flex gap-2'>
                <input
                    type='text'
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder='Nouveau genre (ex : Ragtime)'
                    className='flex-1 px-4 py-2 border-2 border-black rounded'
                />
                <button
                    type='submit'
                    disabled={isPending || !newName.trim()}
                    className='px-4 py-2 text-white rounded bg-purple-dark hover:bg-purple-medium disabled:bg-gray-400 font-medium'
                >
                    Ajouter
                </button>
            </form>

            <div className='border-2 border-black rounded bg-white divide-y divide-gray-200'>
                {genres.length === 0 && (
                    <p className='px-4 py-8 text-center text-gray-500'>
                        Aucun genre pour l&apos;instant.
                    </p>
                )}
                {genres.map(genre => (
                    <div
                        key={genre.id}
                        className='flex flex-wrap items-center gap-3 px-4 py-3'
                    >
                        {editingId === genre.id ? (
                            <>
                                <input
                                    type='text'
                                    value={editingName}
                                    onChange={e =>
                                        setEditingName(e.target.value)
                                    }
                                    className='flex-1 min-w-40 px-3 py-1 border-2 border-black rounded'
                                    autoFocus
                                />
                                <button
                                    type='button'
                                    disabled={isPending || !editingName.trim()}
                                    onClick={() =>
                                        run(() =>
                                            renameGenreAction(
                                                genre.id,
                                                editingName.trim(),
                                            ),
                                        )
                                    }
                                    className='px-3 py-1 text-sm text-white rounded bg-purple-dark hover:bg-purple-medium disabled:bg-gray-400'
                                >
                                    Enregistrer
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setEditingId(null)}
                                    className='px-3 py-1 text-sm border-2 border-black rounded'
                                >
                                    Annuler
                                </button>
                            </>
                        ) : (
                            <>
                                <span className='flex-1 min-w-40 font-medium'>
                                    {genre.name}
                                </span>
                                <span className='text-xs text-gray-600'>
                                    {genre.tablatureCount} tab
                                    {genre.tablatureCount > 1 ? 's' : ''} ·{' '}
                                    {genre.artistCount} artiste
                                    {genre.artistCount > 1 ? 's' : ''}
                                </span>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setEditingId(genre.id)
                                        setEditingName(genre.name)
                                        setConfirmingDeleteId(null)
                                    }}
                                    className='px-3 py-1 text-sm border-2 border-black rounded hover:bg-purple-light'
                                >
                                    Renommer
                                </button>
                                {confirmingDeleteId === genre.id ? (
                                    <span className='flex items-center gap-2'>
                                        <span className='text-xs text-red-700'>
                                            Supprimer «&nbsp;{genre.name}&nbsp;» ?
                                            {genre.tablatureCount +
                                                genre.artistCount >
                                                0 &&
                                                ` (sera retiré de ${genre.tablatureCount} tab(s) et ${genre.artistCount} artiste(s))`}
                                        </span>
                                        <button
                                            type='button'
                                            disabled={isPending}
                                            onClick={() =>
                                                run(() =>
                                                    deleteGenreAction(genre.id),
                                                )
                                            }
                                            className='px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700'
                                        >
                                            Oui, supprimer
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                setConfirmingDeleteId(null)
                                            }
                                            className='px-3 py-1 text-sm border-2 border-black rounded'
                                        >
                                            Annuler
                                        </button>
                                    </span>
                                ) : (
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setConfirmingDeleteId(genre.id)
                                            setEditingId(null)
                                        }}
                                        className='px-3 py-1 text-sm border-2 border-black rounded text-red-600 hover:bg-red-salmon'
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
