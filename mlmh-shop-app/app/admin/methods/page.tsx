import Link from 'next/link'
import { listMethods } from '@/lib/admin/methods'
import HiddenToggle from '../components/HiddenToggle'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{ q?: string; visibilite?: string }>
}

export default async function AdminMethodsPage({ searchParams }: PageProps) {
    const { q, visibilite } = await searchParams

    const methods = await listMethods({
        ...(q ? { q } : {}),
        ...(visibilite === 'visibles'
            ? { hidden: false }
            : visibilite === 'masquees'
              ? { hidden: true }
              : {}),
    })

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
                <h2 className='text-2xl font-bold'>
                    Méthodes{' '}
                    <span className='text-base font-normal text-gray-600'>
                        ({methods.length})
                    </span>
                </h2>
                <Link
                    href='/admin/methods/new'
                    className='px-4 py-2 text-white rounded bg-purple-dark hover:bg-purple-medium font-medium'
                >
                    + Nouvelle méthode
                </Link>
            </div>

            <form className='flex flex-wrap gap-2 mb-6'>
                <input
                    type='text'
                    name='q'
                    defaultValue={q ?? ''}
                    placeholder='Rechercher un titre ou un artiste…'
                    className='flex-1 min-w-48 px-4 py-2 border-2 border-black rounded'
                />
                <select
                    name='visibilite'
                    defaultValue={visibilite ?? ''}
                    className='px-4 py-2 border-2 border-black rounded bg-white'
                >
                    <option value=''>Toutes</option>
                    <option value='visibles'>Visibles</option>
                    <option value='masquees'>Masquées</option>
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
                            <th className='px-4 py-3'>Titre</th>
                            <th className='px-4 py-3'>Artistes</th>
                            <th className='px-4 py-3'>Leçons</th>
                            <th className='px-4 py-3'>Fichiers</th>
                            <th className='px-4 py-3'>Offres</th>
                            <th className='px-4 py-3'>Visibilité</th>
                            <th className='px-4 py-3'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {methods.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className='px-4 py-8 text-center text-gray-500'
                                >
                                    Aucune méthode trouvée.
                                </td>
                            </tr>
                        )}
                        {methods.map(method => (
                            <tr
                                key={method.id}
                                className='border-b border-gray-200 last:border-b-0 hover:bg-purple-light/30'
                            >
                                <td className='px-4 py-3 font-medium'>
                                    <Link
                                        href={`/admin/methods/${method.id}`}
                                        className='hover:underline'
                                    >
                                        {method.title}
                                    </Link>
                                </td>
                                <td className='px-4 py-3'>
                                    {method.artists
                                        .map(a => a.name)
                                        .join(', ') || (
                                        <span className='text-gray-400'>
                                            aucun
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3'>
                                    {method._count.lessons}
                                </td>
                                <td className='px-4 py-3'>
                                    {method._count.files > 0 ? (
                                        method._count.files
                                    ) : (
                                        <span
                                            className='text-red-600 font-medium'
                                            title='Aucun fichier : rien à télécharger après achat !'
                                        >
                                            ⚠️ 0
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3'>
                                    {method._count.offers > 0 ? (
                                        method._count.offers
                                    ) : (
                                        <span
                                            className='text-red-600 font-medium'
                                            title='Aucune offre : rien à acheter !'
                                        >
                                            ⚠️ 0
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3'>
                                    <HiddenToggle
                                        kind='method'
                                        id={method.id}
                                        hidden={method.hidden}
                                    />
                                </td>
                                <td className='px-4 py-3'>
                                    <Link
                                        href={`/admin/methods/${method.id}`}
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
