'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveArtistAction } from '@/lib/actions/admin'
import EntityPicker from './EntityPicker'
import ContentEditor, { resolveContents } from './ContentEditor'
import type { ContentDraft, PickerOption } from './types'

export interface ArtistFormInitial {
    name: string
    description: string
    hidden: boolean
    genreIds: string[]
    contents: Array<{ type: ContentDraft['type']; url: string }>
}

interface ArtistFormProps {
    artistId: string | null // null = création
    initial: ArtistFormInitial | null
    genres: PickerOption[]
}

export default function ArtistForm({
    artistId,
    initial,
    genres,
}: ArtistFormProps) {
    const router = useRouter()
    const isEdit = artistId !== null

    const [name, setName] = useState(initial?.name ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [hidden, setHidden] = useState(initial?.hidden ?? false)
    const [genreIds, setGenreIds] = useState<string[]>(initial?.genreIds ?? [])
    const [contents, setContents] = useState<ContentDraft[]>(
        initial?.contents.map(c => ({
            type: c.type,
            uploadType: 'url',
            url: c.url,
            file: null,
        })) ?? [
            // Par défaut, une entrée photo prête à remplir.
            { type: 'IMAGE', uploadType: 'file', url: '', file: null },
        ],
    )

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            const payload = {
                name,
                description,
                hidden,
                musicalGenres: genreIds,
                contents: await resolveContents(contents),
            }
            const result = await saveArtistAction(artistId, payload)
            if ('error' in result) {
                setError(result.error)
                return
            }
            router.push('/admin/artists')
            router.refresh()
        } catch (err) {
            console.error('Error saving artist:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : "Échec de l'enregistrement.",
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='max-w-2xl space-y-6'>
            {error && (
                <div className='px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded'>
                    {error}
                </div>
            )}

            <div>
                <label className='block mb-2 text-sm font-medium'>Nom *</label>
                <input
                    type='text'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                    required
                />
            </div>

            <div>
                <label className='block mb-2 text-sm font-medium'>
                    Description / biographie
                </label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                />
            </div>

            <EntityPicker
                label='Genres musicaux'
                options={genres}
                selected={genreIds}
                onChange={setGenreIds}
                emptyHint="Aucun genre — crée-les dans l'onglet Genres musicaux."
            />

            <ContentEditor
                label="Photo et contenus de l'artiste"
                hint="La photo de l'artiste est une image ; tu peux aussi ajouter des vidéos ou de l'audio."
                contents={contents}
                onChange={setContents}
            />

            <label className='flex items-center gap-3 py-2 cursor-pointer'>
                <input
                    type='checkbox'
                    checked={hidden}
                    onChange={e => setHidden(e.target.checked)}
                    className='w-4 h-4'
                />
                <span className='text-sm'>
                    <span className='font-medium'>Masquer cet artiste</span> —
                    il n&apos;apparaîtra pas sur le site.
                </span>
            </label>

            <button
                type='submit'
                disabled={saving}
                className='w-full px-4 py-3 text-white transition-colors rounded bg-purple-dark hover:bg-purple-medium disabled:bg-gray-400 disabled:cursor-not-allowed font-medium'
            >
                {saving
                    ? 'Enregistrement…'
                    : isEdit
                      ? 'Enregistrer les modifications'
                      : "Créer l'artiste"}
            </button>
        </form>
    )
}
