'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveTablatureAction } from '@/lib/actions/admin'
import EntityPicker from './EntityPicker'
import FileUploader from './FileUploader'
import ContentEditor, { resolveContents } from './ContentEditor'
import type { ContentDraft, PickerOption, UploadedTabFile } from './types'

export interface TablatureFormInitial {
    title: string
    price: number
    description: string
    publicationDate: string | null // AAAA-MM-JJ
    hidden: boolean
    artistIds: string[]
    genreIds: string[]
    contents: Array<{ type: ContentDraft['type']; url: string }>
    files: UploadedTabFile[]
}

interface TablatureFormProps {
    tablatureId: string | null // null = création
    initial: TablatureFormInitial | null
    artists: PickerOption[]
    genres: PickerOption[]
}

export default function TablatureForm({
    tablatureId,
    initial,
    artists,
    genres,
}: TablatureFormProps) {
    const router = useRouter()
    const isEdit = tablatureId !== null

    const [title, setTitle] = useState(initial?.title ?? '')
    const [price, setPrice] = useState(String(initial?.price ?? 3.5))
    const [description, setDescription] = useState(initial?.description ?? '')
    const [publicationDate, setPublicationDate] = useState(
        initial?.publicationDate ?? '',
    )
    const [hidden, setHidden] = useState(initial?.hidden ?? false)
    const [artistIds, setArtistIds] = useState<string[]>(
        initial?.artistIds ?? [],
    )
    const [genreIds, setGenreIds] = useState<string[]>(initial?.genreIds ?? [])
    const [files, setFiles] = useState<UploadedTabFile[]>(initial?.files ?? [])
    const [contents, setContents] = useState<ContentDraft[]>(
        initial?.contents.map(c => ({
            type: c.type,
            uploadType: 'url',
            url: c.url,
            file: null,
        })) ?? [],
    )

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const parsedPrice = Number(price.replace(',', '.'))
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setError('Le prix est invalide.')
            return
        }
        if (artistIds.length === 0) {
            setError('Sélectionne au moins un artiste.')
            return
        }
        if (files.length === 0) {
            setError(
                "Aucun fichier de tablature : uploade au moins un fichier (c'est ce que le client achète).",
            )
            return
        }

        setSaving(true)
        try {
            const payload = {
                title,
                price: parsedPrice,
                description,
                publicationDate: publicationDate || null,
                hidden,
                artists: artistIds,
                musicalGenres: genreIds,
                contents: await resolveContents(contents),
                files,
            }
            const result = await saveTablatureAction(tablatureId, payload)
            if ('error' in result) {
                setError(result.error)
                return
            }
            router.push('/admin/tablatures')
            router.refresh()
        } catch (err) {
            console.error('Error saving tablature:', err)
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
                <label className='block mb-2 text-sm font-medium'>
                    Titre *
                </label>
                <input
                    type='text'
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                    required
                />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Prix (€) *
                    </label>
                    <input
                        type='text'
                        inputMode='decimal'
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        required
                    />
                </div>
                <div>
                    <label className='block mb-2 text-sm font-medium'>
                        Date de publication (facultatif)
                    </label>
                    <input
                        type='date'
                        value={publicationDate}
                        onChange={e => setPublicationDate(e.target.value)}
                        className='w-full px-4 py-2 border-2 border-black rounded'
                    />
                </div>
            </div>

            <FileUploader title={title} files={files} onChange={setFiles} />

            <div>
                <label className='block mb-2 text-sm font-medium'>
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                />
            </div>

            <EntityPicker
                label='Artistes'
                required
                options={artists}
                selected={artistIds}
                onChange={setArtistIds}
                emptyHint="Aucun artiste — crée d'abord l'artiste dans l'onglet Artistes."
            />

            <EntityPicker
                label='Genres musicaux'
                options={genres}
                selected={genreIds}
                onChange={setGenreIds}
                emptyHint="Aucun genre — crée-les dans l'onglet Genres musicaux."
            />

            <ContentEditor
                label='Contenus bonus'
                hint='Vidéos YouTube, extraits audio, images… affichés sur la page produit.'
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
                    <span className='font-medium'>Masquer cette tablature</span>{' '}
                    — elle n&apos;apparaîtra pas sur le site.
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
                      : 'Créer la tablature'}
            </button>
        </form>
    )
}
