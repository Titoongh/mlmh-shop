import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArtist } from '@/lib/admin/artists'
import { listGenres } from '@/lib/admin/genres'
import { artistPath } from '@/lib/slug'
import ArtistForm, {
    type ArtistFormInitial,
} from '../../components/ArtistForm'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditArtistPage({ params }: PageProps) {
    const { id } = await params

    const [artist, genres] = await Promise.all([getArtist(id), listGenres()])

    if (!artist) notFound()

    const initial: ArtistFormInitial = {
        name: artist.name,
        description: artist.description ?? '',
        hidden: artist.hidden,
        genreIds: artist.musicalGenres.map(g => g.id),
        contents: [...artist.contents]
            .sort((a, b) => a.rank - b.rank)
            .map(c => ({ type: c.type, url: c.url ?? '' })),
    }

    return (
        <div>
            <Link
                href='/admin/artists'
                className='text-sm underline text-purple-dark'
            >
                ← Retour aux artistes
            </Link>
            <div className='flex flex-wrap items-center gap-4 mt-2 mb-6'>
                <h2 className='text-2xl font-bold'>
                    Modifier : {artist.name}
                </h2>
                <Link
                    href={artistPath(artist)}
                    target='_blank'
                    className='text-sm underline text-purple-dark'
                >
                    Voir sur le site ↗
                </Link>
            </div>
            <ArtistForm
                artistId={artist.id}
                initial={initial}
                genres={genres.map(g => ({ id: g.id, name: g.name }))}
            />
        </div>
    )
}
