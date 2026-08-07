import Link from 'next/link'
import { listGenres } from '@/lib/admin/genres'
import ArtistForm from '../../components/ArtistForm'

export const dynamic = 'force-dynamic'

export default async function NewArtistPage() {
    const genres = await listGenres()

    return (
        <div>
            <Link
                href='/admin/artists'
                className='text-sm underline text-purple-dark'
            >
                ← Retour aux artistes
            </Link>
            <h2 className='text-2xl font-bold mt-2 mb-6'>Nouvel artiste</h2>
            <ArtistForm
                artistId={null}
                initial={null}
                genres={genres.map(g => ({ id: g.id, name: g.name }))}
            />
        </div>
    )
}
