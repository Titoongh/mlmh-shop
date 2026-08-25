import Link from 'next/link'
import { listArtists } from '@/lib/admin/artists'
import { listGenres } from '@/lib/admin/genres'
import MethodForm from '../../components/MethodForm'

export const dynamic = 'force-dynamic'

export default async function NewMethodPage() {
    const [artists, genres] = await Promise.all([listArtists(), listGenres()])

    return (
        <div>
            <Link
                href='/admin/methods'
                className='text-sm underline text-purple-dark'
            >
                ← Retour aux méthodes
            </Link>
            <h2 className='text-2xl font-bold mt-2 mb-6'>Nouvelle méthode</h2>
            <MethodForm
                methodId={null}
                initial={null}
                artists={artists.map(a => ({ id: a.id, name: a.name }))}
                genres={genres.map(g => ({ id: g.id, name: g.name }))}
            />
        </div>
    )
}
