import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTablature } from '@/lib/admin/tablatures'
import { listArtists } from '@/lib/admin/artists'
import { listGenres } from '@/lib/admin/genres'
import { tablaturePath } from '@/lib/slug'
import TablatureForm, {
    type TablatureFormInitial,
} from '../../components/TablatureForm'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditTablaturePage({ params }: PageProps) {
    const { id } = await params

    const [tablature, artists, genres] = await Promise.all([
        getTablature(id),
        listArtists(),
        listGenres(),
    ])

    if (!tablature) notFound()

    const initial: TablatureFormInitial = {
        title: tablature.title,
        price: tablature.price,
        description: tablature.description ?? '',
        publicationDate: tablature.publicationDate
            ? tablature.publicationDate.toISOString().slice(0, 10)
            : null,
        hidden: tablature.hidden,
        artistIds: tablature.artists.map(a => a.id),
        genreIds: tablature.musicalGenres.map(g => g.id),
        contents: [...tablature.contents]
            .sort((a, b) => a.rank - b.rank)
            .map(c => ({ type: c.type, url: c.url ?? '' })),
        files: tablature.files.map(f => ({
            filename: f.filename,
            scalewayKey: f.scalewayKey,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
        })),
    }

    return (
        <div>
            <Link
                href='/admin/tablatures'
                className='text-sm underline text-purple-dark'
            >
                ← Retour aux tablatures
            </Link>
            <div className='flex flex-wrap items-center gap-4 mt-2 mb-6'>
                <h2 className='text-2xl font-bold'>Modifier : {tablature.title}</h2>
                <Link
                    href={tablaturePath(tablature)}
                    target='_blank'
                    className='text-sm underline text-purple-dark'
                >
                    Voir sur le site ↗
                </Link>
            </div>
            <TablatureForm
                tablatureId={tablature.id}
                initial={initial}
                artists={artists.map(a => ({ id: a.id, name: a.name }))}
                genres={genres.map(g => ({ id: g.id, name: g.name }))}
            />
        </div>
    )
}
