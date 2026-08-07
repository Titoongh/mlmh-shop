import Link from 'next/link'
import { listArtists } from '@/lib/admin/artists'
import HiddenToggle from '../components/HiddenToggle'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{ q?: string; visibilite?: string }>
}

export default async function AdminArtistsPage({ searchParams }: PageProps) {
    const { q, visibilite } = await searchParams

    const artists = await listArtists({
        ...(q ? { q } : {}),
        ...(visibilite === 'visibles'
            ? { hidden: false }
            : visibilite === 'masques'
              ? { hidden: true }
              : {}),
    })

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
                <h2 className='text-2xl font-bold'>
                    Artistes{' '}
                    <span className='text-base font-normal text-gray-600'>
                        ({artists.length})
                    </span>
                </h2>
                <Link
                    href='/admin/artists/new'
                    className='px-4 py-2 text-white rounded bg-purple-dark hover:bg-purple-medium font-medium'
                >
                    + Nouvel artiste
                </Link>
            </div>

            <form className='flex flex-wrap gap-2 mb-6'>
                <input
                    type='text'
                    name='q'
                    defaultValue={q ?? ''}
                    placeholder='Rechercher un artiste…'
                    className='flex-1 min-w-48 px-4 py-2 border-2 border-black rounded'
                />
                <select
                    name='visibilite'
                    defaultValue={visibilite ?? ''}
                    className='px-4 py-2 border-2 border-black rounded bg-white'
                >
                    <option value=''>Tous</option>
                    <option value='visibles'>Visibles</option>
                    <option value='masques'>Masqués</option>
                </select>
                <button
                    type='submit'
                    className='px-4 py-2 border-2 border-black rounded bg-white hover:bg-purple-light font-medium'
                >
                    Filtrer
                </button>
            </form>

            <div className='overflow-x-auto border-2 border-black rounded bg-white'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='border-b-2 border-black text-left'>
                            <th className='px-4 py-3'>Nom</th>
                            <th className='px-4 py-3'>Genres</th>
                            <th className='px-4 py-3'>Tablatures</th>
                            <th className='px-4 py-3'>Visibilité</th>
                            <th className='px-4 py-3'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {artists.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className='px-4 py-8 text-center text-gray-500'
                                >
                                    Aucun artiste trouvé.
                                </td>
                            </tr>
                        )}
                        {artists.map(artist => (
                            <tr
                                key={artist.id}
                                className='border-b border-gray-200 last:border-b-0 hover:bg-purple-light/30'
                            >
                                <td className='px-4 py-3 font-medium'>
                                    <Link
                                        href={`/admin/artists/${artist.id}`}
                                        className='hover:underline'
                                    >
                                        {artist.name}
                                    </Link>
                                </td>
                                <td className='px-4 py-3'>
                                    {artist.musicalGenres
                                        .map(g => g.name)
                                        .join(', ') || '—'}
                                </td>
                                <td className='px-4 py-3'>
                                    {artist._count.tablatures}
                                </td>
                                <td className='px-4 py-3'>
                                    <HiddenToggle
                                        kind='artist'
                                        id={artist.id}
                                        hidden={artist.hidden}
                                    />
                                </td>
                                <td className='px-4 py-3'>
                                    <Link
                                        href={`/admin/artists/${artist.id}`}
                                        className='underline text-purple-dark whitespace-nowrap'
                                    >
                                        Modifier
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
