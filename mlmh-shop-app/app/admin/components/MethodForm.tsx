'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveMethodAction } from '@/lib/actions/admin'
import EntityPicker from './EntityPicker'
import FileUploader from './FileUploader'
import ContentEditor, { resolveContents } from './ContentEditor'
import type { ContentDraft, PickerOption, UploadedTabFile } from './types'

// Formulaire méthode : mêmes conventions que TablatureForm (upload avant
// submit, payload envoyé au server action), plus trois sections propres aux
// méthodes : Leçons, rôles/rattachement des fichiers, Offres.
// Les refs de leçons envoyées au serveur : id DB pour une leçon existante,
// ref temporaire "new-<n>" pour une nouvelle (voir lib/admin/validation.ts).

type FileRole = 'DOCUMENT' | 'AUDIO' | 'VIDEO'
type OfferKind = 'FULL' | 'DOCUMENTS' | 'LESSON'

interface LessonDraft {
    ref: string
    title: string
}

interface MethodFileDraft extends UploadedTabFile {
    role: FileRole
    lessonRef: string | null // null = fichier niveau méthode (couverture…)
}

interface OfferDraft {
    id: string | null // id DB pour une offre existante
    kind: OfferKind
    lessonRef: string | null
    title: string
    price: string
    hidden: boolean
}

export interface MethodFormInitial {
    title: string
    description: string
    publicationDate: string | null // AAAA-MM-JJ
    hidden: boolean
    artistIds: string[]
    genreIds: string[]
    contents: Array<{ type: ContentDraft['type']; url: string }>
    lessons: LessonDraft[]
    files: MethodFileDraft[]
    offers: OfferDraft[]
}

interface MethodFormProps {
    methodId: string | null // null = création
    initial: MethodFormInitial | null
    artists: PickerOption[]
    genres: PickerOption[]
}

const METHOD_EXTENSIONS = ['pdf', 'txt', 'jpg', 'jpeg', 'mp3', 'mp4']

const DEFAULT_PRICES = { FULL: '24.95', DOCUMENTS: '17', LESSON: '6' }

function defaultRoleFor(filename: string): FileRole {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'mp3') return 'AUDIO'
    if (ext === 'mp4') return 'VIDEO'
    return 'DOCUMENT'
}

export default function MethodForm({
    methodId,
    initial,
    artists,
    genres,
}: MethodFormProps) {
    const router = useRouter()
    const isEdit = methodId !== null

    const [title, setTitle] = useState(initial?.title ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [publicationDate, setPublicationDate] = useState(
        initial?.publicationDate ?? '',
    )
    const [hidden, setHidden] = useState(initial?.hidden ?? false)
    const [artistIds, setArtistIds] = useState<string[]>(
        initial?.artistIds ?? [],
    )
    const [genreIds, setGenreIds] = useState<string[]>(initial?.genreIds ?? [])
    const [contents, setContents] = useState<ContentDraft[]>(
        initial?.contents.map(c => ({
            type: c.type,
            uploadType: 'url',
            url: c.url,
            file: null,
        })) ?? [],
    )
    const [lessons, setLessons] = useState<LessonDraft[]>(
        initial?.lessons ?? [],
    )
    const [files, setFiles] = useState<MethodFileDraft[]>(initial?.files ?? [])
    const [offers, setOffers] = useState<OfferDraft[]>(initial?.offers ?? [])
    const [newLessonCounter, setNewLessonCounter] = useState(0)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // --- Leçons ---
    const addLesson = () => {
        setLessons([...lessons, { ref: `new-${newLessonCounter}`, title: '' }])
        setNewLessonCounter(n => n + 1)
    }

    const updateLessonTitle = (index: number, value: string) => {
        setLessons(prev =>
            prev.map((l, i) => (i === index ? { ...l, title: value } : l)),
        )
    }

    const removeLesson = (index: number) => {
        const removed = lessons[index]
        setLessons(prev => prev.filter((_, i) => i !== index))
        // Détache fichiers et offres qui pointaient cette leçon.
        setFiles(prev =>
            prev.map(f =>
                f.lessonRef === removed.ref ? { ...f, lessonRef: null } : f,
            ),
        )
        setOffers(prev => prev.filter(o => o.lessonRef !== removed.ref))
    }

    const moveLesson = (index: number, direction: -1 | 1) => {
        const target = index + direction
        if (target < 0 || target >= lessons.length) return
        setLessons(prev => {
            const next = [...prev]
            const tmp = next[index]
            next[index] = next[target]
            next[target] = tmp
            return next
        })
    }

    // --- Fichiers ---
    // FileUploader manipule des UploadedTabFile ; on réinjecte role/lessonRef
    // pour les fichiers déjà connus et on infère un rôle par extension pour
    // les nouveaux.
    const handleFilesChange = (next: UploadedTabFile[]) => {
        setFiles(
            next.map(file => {
                const known = files.find(
                    f => f.scalewayKey === file.scalewayKey,
                )
                return (
                    known ?? {
                        ...file,
                        role: defaultRoleFor(file.filename),
                        lessonRef: null,
                    }
                )
            }),
        )
    }

    const updateFile = (index: number, patch: Partial<MethodFileDraft>) => {
        setFiles(prev =>
            prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
        )
    }

    // --- Offres ---
    const addOffer = (kind: OfferKind) => {
        setOffers(prev => [
            ...prev,
            {
                id: null,
                kind,
                lessonRef: kind === 'LESSON' ? lessons[0]?.ref ?? null : null,
                title:
                    kind === 'FULL'
                        ? 'Complete package'
                        : kind === 'DOCUMENTS'
                          ? 'PDF booklet'
                          : 'Lesson',
                price: DEFAULT_PRICES[kind],
                hidden: false,
            },
        ])
    }

    const updateOffer = (index: number, patch: Partial<OfferDraft>) => {
        setOffers(prev =>
            prev.map((o, i) => (i === index ? { ...o, ...patch } : o)),
        )
    }

    const removeOffer = (index: number) => {
        setOffers(prev => prev.filter((_, i) => i !== index))
    }

    // Préremplissage éditable : la totale + le livret PDF + une offre par leçon.
    const generateStandardOffers = () => {
        const existingLessonRefs = new Set(
            offers.filter(o => o.kind === 'LESSON').map(o => o.lessonRef),
        )
        const generated: OfferDraft[] = []
        if (!offers.some(o => o.kind === 'FULL')) {
            generated.push({
                id: null,
                kind: 'FULL',
                lessonRef: null,
                title: 'Complete package',
                price: DEFAULT_PRICES.FULL,
                hidden: false,
            })
        }
        if (!offers.some(o => o.kind === 'DOCUMENTS')) {
            generated.push({
                id: null,
                kind: 'DOCUMENTS',
                lessonRef: null,
                title: 'PDF booklet',
                price: DEFAULT_PRICES.DOCUMENTS,
                hidden: false,
            })
        }
        lessons.forEach(lesson => {
            if (!existingLessonRefs.has(lesson.ref)) {
                generated.push({
                    id: null,
                    kind: 'LESSON',
                    lessonRef: lesson.ref,
                    title: `Lesson: ${lesson.title || 'sans titre'}`,
                    price: DEFAULT_PRICES.LESSON,
                    hidden: false,
                })
            }
        })
        setOffers(prev => [...prev, ...generated])
    }

    const lessonLabel = (ref: string | null) =>
        lessons.find(l => l.ref === ref)?.title || '(leçon inconnue)'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (lessons.some(l => !l.title.trim())) {
            setError('Chaque leçon doit avoir un titre.')
            return
        }
        if (files.length === 0) {
            setError(
                "Aucun fichier : uploade au moins un fichier (c'est ce que le client achète).",
            )
            return
        }
        if (offers.length === 0) {
            setError(
                'Aucune offre : ajoute au moins une offre (bouton « Générer les offres standard »).',
            )
            return
        }
        const badOffer = offers.find(
            o =>
                Number.isNaN(Number(o.price.replace(',', '.'))) ||
                Number(o.price.replace(',', '.')) < 0,
        )
        if (badOffer) {
            setError(`Prix invalide pour l'offre « ${badOffer.title} ».`)
            return
        }

        setSaving(true)
        try {
            const payload = {
                title,
                description,
                publicationDate: publicationDate || null,
                hidden,
                artists: artistIds,
                musicalGenres: genreIds,
                contents: await resolveContents(contents),
                lessons: lessons.map((lesson, index) => ({
                    ref: lesson.ref,
                    title: lesson.title,
                    rank: index + 1,
                })),
                files: files.map(file => ({
                    filename: file.filename,
                    scalewayKey: file.scalewayKey,
                    fileSize: file.fileSize ?? null,
                    mimeType: file.mimeType ?? null,
                    role: file.role,
                    lessonRef: file.lessonRef,
                })),
                offers: offers.map(offer => ({
                    id: offer.id,
                    kind: offer.kind,
                    lessonRef: offer.lessonRef,
                    title: offer.title,
                    price: Number(offer.price.replace(',', '.')),
                    hidden: offer.hidden,
                })),
            }
            const result = await saveMethodAction(methodId, payload)
            if ('error' in result) {
                setError(result.error)
                return
            }
            router.push('/admin/methods')
            router.refresh()
        } catch (err) {
            console.error('Error saving method:', err)
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
        <form onSubmit={handleSubmit} className='max-w-3xl space-y-8'>
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
                    placeholder='The Guitar Of Merle Travis - Volume 2'
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
                    className='w-full px-4 py-2 border-2 border-black rounded sm:max-w-xs'
                />
            </div>

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

            {/* --- Leçons --- */}
            <section className='space-y-3'>
                <div>
                    <h3 className='text-lg font-bold'>Leçons</h3>
                    <p className='text-sm text-gray-600'>
                        Un morceau enseigné = une leçon. L&apos;ordre de la
                        liste devient l&apos;ordre d&apos;affichage.
                    </p>
                </div>
                {lessons.map((lesson, index) => (
                    <div
                        key={lesson.ref}
                        className='flex items-center gap-2 p-2 border-2 border-black rounded bg-white'
                    >
                        <span className='text-sm font-mono text-gray-500 w-6 text-center'>
                            {index + 1}
                        </span>
                        <input
                            type='text'
                            value={lesson.title}
                            onChange={e =>
                                updateLessonTitle(index, e.target.value)
                            }
                            placeholder='Titre du morceau (ex. Guitar Rag)'
                            className='flex-1 px-3 py-1.5 border border-gray-300 rounded'
                        />
                        <button
                            type='button'
                            onClick={() => moveLesson(index, -1)}
                            disabled={index === 0}
                            className='px-2 text-gray-600 disabled:opacity-30'
                            aria-label='Monter'
                        >
                            ↑
                        </button>
                        <button
                            type='button'
                            onClick={() => moveLesson(index, 1)}
                            disabled={index === lessons.length - 1}
                            className='px-2 text-gray-600 disabled:opacity-30'
                            aria-label='Descendre'
                        >
                            ↓
                        </button>
                        <button
                            type='button'
                            onClick={() => removeLesson(index)}
                            className='px-2 text-sm text-red-600 hover:text-red-800'
                        >
                            Retirer
                        </button>
                    </div>
                ))}
                <button
                    type='button'
                    onClick={addLesson}
                    className='px-4 py-2 border-2 border-black rounded bg-white hover:bg-purple-light font-medium'
                >
                    + Ajouter une leçon
                </button>
            </section>

            {/* --- Fichiers --- */}
            <section className='space-y-3'>
                <FileUploader
                    title={title}
                    files={files}
                    onChange={handleFilesChange}
                    uploadEndpoint='/api/admin/upload/method'
                    allowedExtensions={METHOD_EXTENSIONS}
                    label='Fichiers de la méthode'
                    helpText='PDF, txt, jpg/jpeg, mp3 ou mp4. Assigne ensuite chaque fichier à une leçon (ou laisse « Fichier de la méthode » pour la couverture).'
                />
                {files.length > 0 && (
                    <div className='space-y-2'>
                        <h4 className='text-sm font-medium'>
                            Rôle et leçon de chaque fichier :
                        </h4>
                        {files.map((file, index) => (
                            <div
                                key={file.scalewayKey}
                                className='flex flex-col sm:flex-row sm:items-center gap-2 p-2 border border-gray-300 rounded'
                            >
                                <span className='flex-1 text-sm truncate'>
                                    {file.filename}
                                </span>
                                <select
                                    value={file.role}
                                    onChange={e =>
                                        updateFile(index, {
                                            role: e.target
                                                .value as FileRole,
                                        })
                                    }
                                    className='px-2 py-1 border border-gray-300 rounded text-sm'
                                >
                                    <option value='DOCUMENT'>Document</option>
                                    <option value='AUDIO'>Audio</option>
                                    <option value='VIDEO'>Vidéo</option>
                                </select>
                                <select
                                    value={file.lessonRef ?? ''}
                                    onChange={e =>
                                        updateFile(index, {
                                            lessonRef:
                                                e.target.value || null,
                                        })
                                    }
                                    className='px-2 py-1 border border-gray-300 rounded text-sm max-w-[220px]'
                                >
                                    <option value=''>
                                        Fichier de la méthode (couverture…)
                                    </option>
                                    {lessons.map(lesson => (
                                        <option
                                            key={lesson.ref}
                                            value={lesson.ref}
                                        >
                                            {lesson.title || '(sans titre)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* --- Offres --- */}
            <section className='space-y-3'>
                <div>
                    <h3 className='text-lg font-bold'>Offres</h3>
                    <p className='text-sm text-gray-600'>
                        Ce que le client peut acheter : la totale (FULL), le
                        livret PDF seul (DOCUMENTS), ou chaque leçon à
                        l&apos;unité (LESSON). Les titres sont affichés sur le
                        site (en anglais).
                    </p>
                </div>
                <button
                    type='button'
                    onClick={generateStandardOffers}
                    className='px-4 py-2 border-2 border-black rounded bg-orange-khaki/40 hover:bg-orange-khaki font-medium'
                >
                    Générer les offres standard
                </button>
                {offers.map((offer, index) => (
                    <div
                        key={offer.id ?? `new-offer-${index}`}
                        className='flex flex-col sm:flex-row sm:items-center gap-2 p-2 border-2 border-black rounded bg-white'
                    >
                        <select
                            value={offer.kind}
                            onChange={e => {
                                const kind = e.target.value as OfferKind
                                updateOffer(index, {
                                    kind,
                                    lessonRef:
                                        kind === 'LESSON'
                                            ? offer.lessonRef ??
                                              lessons[0]?.ref ??
                                              null
                                            : null,
                                })
                            }}
                            className='px-2 py-1 border border-gray-300 rounded text-sm'
                        >
                            <option value='FULL'>FULL</option>
                            <option value='DOCUMENTS'>DOCUMENTS</option>
                            <option value='LESSON'>LESSON</option>
                        </select>
                        {offer.kind === 'LESSON' && (
                            <select
                                value={offer.lessonRef ?? ''}
                                onChange={e =>
                                    updateOffer(index, {
                                        lessonRef: e.target.value || null,
                                    })
                                }
                                className='px-2 py-1 border border-gray-300 rounded text-sm max-w-[180px]'
                            >
                                <option value=''>Choisir une leçon…</option>
                                {lessons.map(lesson => (
                                    <option key={lesson.ref} value={lesson.ref}>
                                        {lesson.title || '(sans titre)'}
                                    </option>
                                ))}
                            </select>
                        )}
                        <input
                            type='text'
                            value={offer.title}
                            onChange={e =>
                                updateOffer(index, { title: e.target.value })
                            }
                            placeholder="Titre de l'offre"
                            className='flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm'
                        />
                        <div className='flex items-center gap-1'>
                            <input
                                type='text'
                                inputMode='decimal'
                                value={offer.price}
                                onChange={e =>
                                    updateOffer(index, {
                                        price: e.target.value,
                                    })
                                }
                                className='w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-right'
                            />
                            <span className='text-sm'>€</span>
                        </div>
                        <label className='flex items-center gap-1 text-xs'>
                            <input
                                type='checkbox'
                                checked={offer.hidden}
                                onChange={e =>
                                    updateOffer(index, {
                                        hidden: e.target.checked,
                                    })
                                }
                            />
                            Masquée
                        </label>
                        <button
                            type='button'
                            onClick={() => removeOffer(index)}
                            className='px-2 text-sm text-red-600 hover:text-red-800'
                        >
                            Retirer
                        </button>
                    </div>
                ))}
                {isEdit && (
                    <p className='text-xs text-gray-500'>
                        NB : retirer une offre déjà vendue la masque côté
                        serveur au lieu de la supprimer (l&apos;historique
                        d&apos;achat y est rattaché).
                    </p>
                )}
            </section>

            <EntityPicker
                label='Artistes (facultatif)'
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
                hint='Image de couverture, vidéos YouTube, extraits audio… affichés sur la page produit.'
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
                    <span className='font-medium'>Masquer cette méthode</span>{' '}
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
                      : 'Créer la méthode'}
            </button>
        </form>
    )
}
