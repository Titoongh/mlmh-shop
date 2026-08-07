'use client'

import type { ContentDraft } from './types'

const TYPE_LABELS: Record<ContentDraft['type'], string> = {
    VIDEO: 'Vidéo (YouTube…)',
    AUDIO: 'Audio',
    IMAGE: 'Image',
}

interface ContentEditorProps {
    label: string
    hint?: string
    contents: ContentDraft[]
    onChange: (contents: ContentDraft[]) => void
    // Pour la photo d'artiste : fige le type sur IMAGE.
    imageOnly?: boolean
}

// Éditeur des contenus bonus (vidéos YouTube, extraits audio, images).
// L'ordre dans la liste = ordre d'affichage (rank), réordonnable via ▲/▼.
export default function ContentEditor({
    label,
    hint,
    contents,
    onChange,
    imageOnly,
}: ContentEditorProps) {
    const update = (index: number, patch: Partial<ContentDraft>) => {
        onChange(
            contents.map((c, i) => (i === index ? { ...c, ...patch } : c)),
        )
    }

    const remove = (index: number) => {
        onChange(contents.filter((_, i) => i !== index))
    }

    const move = (index: number, delta: -1 | 1) => {
        const target = index + delta
        if (target < 0 || target >= contents.length) return
        const next = [...contents]
        const [item] = next.splice(index, 1)
        next.splice(target, 0, item)
        onChange(next)
    }

    const add = () => {
        onChange([
            ...contents,
            {
                type: imageOnly ? 'IMAGE' : 'VIDEO',
                uploadType: 'url',
                url: '',
                file: null,
            },
        ])
    }

    return (
        <div>
            <div className='flex items-center justify-between mb-2'>
                <label className='block text-sm font-medium'>{label}</label>
                <button
                    type='button'
                    onClick={add}
                    className='text-sm underline text-purple-dark'
                >
                    + Ajouter
                </button>
            </div>
            {hint && <p className='text-sm text-gray-600 mb-3'>{hint}</p>}

            <div className='space-y-4'>
                {contents.map((content, index) => (
                    <div
                        key={index}
                        className='border-2 border-black p-4 rounded space-y-3 bg-white'
                    >
                        <div className='flex items-center justify-between gap-2'>
                            {imageOnly ? (
                                <span className='text-sm font-medium'>
                                    Image
                                </span>
                            ) : (
                                <select
                                    value={content.type}
                                    onChange={e =>
                                        update(index, {
                                            type: e.target
                                                .value as ContentDraft['type'],
                                        })
                                    }
                                    className='px-3 py-1 border-2 border-black rounded'
                                >
                                    {(
                                        Object.keys(
                                            TYPE_LABELS,
                                        ) as ContentDraft['type'][]
                                    ).map(type => (
                                        <option key={type} value={type}>
                                            {TYPE_LABELS[type]}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className='flex items-center gap-2'>
                                {contents.length > 1 && (
                                    <>
                                        <button
                                            type='button'
                                            onClick={() => move(index, -1)}
                                            disabled={index === 0}
                                            title='Monter'
                                            className='px-2 border-2 border-black rounded disabled:opacity-30'
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => move(index, 1)}
                                            disabled={
                                                index === contents.length - 1
                                            }
                                            title='Descendre'
                                            className='px-2 border-2 border-black rounded disabled:opacity-30'
                                        >
                                            ▼
                                        </button>
                                    </>
                                )}
                                <button
                                    type='button'
                                    onClick={() => remove(index)}
                                    className='text-sm text-red-600 hover:text-red-800'
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>

                        <div className='flex gap-4'>
                            <label className='flex items-center gap-2 text-sm'>
                                <input
                                    type='radio'
                                    checked={content.uploadType === 'url'}
                                    onChange={() =>
                                        update(index, { uploadType: 'url' })
                                    }
                                />
                                Lien (URL)
                            </label>
                            <label className='flex items-center gap-2 text-sm'>
                                <input
                                    type='radio'
                                    checked={content.uploadType === 'file'}
                                    onChange={() =>
                                        update(index, { uploadType: 'file' })
                                    }
                                />
                                Fichier à uploader
                            </label>
                        </div>

                        {content.uploadType === 'url' ? (
                            <input
                                type='text'
                                value={content.url}
                                onChange={e =>
                                    update(index, { url: e.target.value })
                                }
                                placeholder={
                                    content.type === 'VIDEO'
                                        ? 'https://www.youtube.com/watch?v=…'
                                        : 'https://…'
                                }
                                className='w-full px-4 py-2 border-2 border-black rounded'
                            />
                        ) : (
                            <div>
                                <input
                                    type='file'
                                    accept={
                                        content.type === 'IMAGE'
                                            ? 'image/*'
                                            : content.type === 'AUDIO'
                                              ? 'audio/*'
                                              : 'video/*'
                                    }
                                    onChange={e =>
                                        update(index, {
                                            file: e.target.files?.[0] ?? null,
                                        })
                                    }
                                    className='w-full px-4 py-2 border-2 border-black rounded'
                                />
                                {content.url && !content.file && (
                                    <p className='mt-1 text-xs text-gray-600'>
                                        Fichier actuel : {content.url}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// Uploade les fichiers des brouillons (via /api/admin/upload) et retourne les
// contenus finaux {type, url, rank} — le rank suit l'ordre de la liste.
export async function resolveContents(
    contents: ContentDraft[],
): Promise<Array<{ type: ContentDraft['type']; url: string; rank: number }>> {
    const resolved = await Promise.all(
        contents.map(async (content, index) => {
            let url = content.url
            if (content.uploadType === 'file' && content.file) {
                const formData = new FormData()
                formData.append('file', content.file)
                const response = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData,
                })
                if (!response.ok) {
                    throw new Error(
                        `Échec de l'upload du contenu n°${index + 1}`,
                    )
                }
                const data = await response.json()
                url = data.url
            }
            return { type: content.type, url, rank: index + 1 }
        }),
    )
    // Les contenus sans URL (ligne ajoutée puis laissée vide) sont ignorés.
    return resolved.filter(c => c.url.trim() !== '')
}
