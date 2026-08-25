import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMethod } from '@/lib/admin/methods'
import { listArtists } from '@/lib/admin/artists'
import { listGenres } from '@/lib/admin/genres'
import { methodPath } from '@/lib/slug'
import MethodForm, {
    type MethodFormInitial,
} from '../../components/MethodForm'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditMethodPage({ params }: PageProps) {
    const { id } = await params

    const [method, artists, genres] = await Promise.all([
        getMethod(id),
        listArtists(),
        listGenres(),
    ])

    if (!method) notFound()

    // Les refs de leçons côté formulaire = leurs ids DB (voir validation.ts).
    const initial: MethodFormInitial = {
        title: method.title,
        description: method.description ?? '',
        publicationDate: method.publicationDate
            ? method.publicationDate.toISOString().slice(0, 10)
            : null,
        hidden: method.hidden,
        artistIds: method.artists.map(a => a.id),
        genreIds: method.musicalGenres.map(g => g.id),
        contents: [...method.contents]
            .sort((a, b) => a.rank - b.rank)
            .map(c => ({ type: c.type, url: c.url ?? '' })),
        lessons: method.lessons.map(lesson => ({
            ref: lesson.id,
            title: lesson.title,
        })),
        files: method.files.map(f => ({
            filename: f.filename,
            scalewayKey: f.scalewayKey,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            role: f.role,
            lessonRef: f.lessonId,
        })),
        offers: method.offers.map(offer => ({
            id: offer.id,
            kind: offer.kind,
            lessonRef: offer.lessonId,
            title: offer.title,
            price: String(offer.price),
            hidden: offer.hidden,
        })),
    }

    return (
        <div>
            <Link
                href='/admin/methods'
                className='text-sm underline text-purple-dark'
            >
                ← Retour aux méthodes
            </Link>
            <div className='flex flex-wrap items-center gap-4 mt-2 mb-6'>
                <h2 className='text-2xl font-bold'>
                    Modifier : {method.title}
                </h2>
                <Link
                    href={methodPath(method)}
                    target='_blank'
                    className='text-sm underline text-purple-dark'
                >
                    Voir sur le site ↗
                </Link>
            </div>
            <MethodForm
                methodId={method.id}
                initial={initial}
                artists={artists.map(a => ({ id: a.id, name: a.name }))}
                genres={genres.map(g => ({ id: g.id, name: g.name }))}
            />
        </div>
    )
}
