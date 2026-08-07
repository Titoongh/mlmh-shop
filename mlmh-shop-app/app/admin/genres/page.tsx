import { listGenres } from '@/lib/admin/genres'
import GenreManager from './GenreManager'

export const dynamic = 'force-dynamic'

export default async function AdminGenresPage() {
    const genres = await listGenres()

    return (
        <div>
            <h2 className='text-2xl font-bold mb-6'>
                Genres musicaux{' '}
                <span className='text-base font-normal text-gray-600'>
                    ({genres.length})
                </span>
            </h2>
            <GenreManager
                genres={genres.map(g => ({
                    id: g.id,
                    name: g.name,
                    artistCount: g._count.artists,
                    tablatureCount: g._count.tablatures,
                }))}
            />
        </div>
    )
}
