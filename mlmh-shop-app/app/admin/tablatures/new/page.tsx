import Link from 'next/link'
import { listArtists } from '@/lib/admin/artists'
import { listGenres } from '@/lib/admin/genres'
import TablatureForm from '../../components/TablatureForm'

export const dynamic = 'force-dynamic'

export default async function NewTablaturePage() {
    const [artists, genres] = await Promise.all([listArtists(), listGenres()])

    return (
        <div>
            <Link
                href='/admin/tablatures'
                className='text-sm underline text-purple-dark'
            >
                ← Retour aux tablatures
            </Link>
            <h2 className='text-2xl font-bold mt-2 mb-6'>
                Nouvelle tablature
            </h2>
            <TablatureForm
                tablatureId={null}
                initial={null}
                artists={artists.map(a => ({ id: a.id, name: a.name }))}
                genres={genres.map(g => ({ id: g.id, name: g.name }))}
            />
        </div>
    )
}
