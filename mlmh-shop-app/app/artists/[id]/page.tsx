import UpdateButton from '@/app/components/adminButtons'
import { TablatureCard } from '@/app/components/ArtistViews'
import S3Image from '@/app/components/S3Image'
import { getArtistById, getVisibleArtistIds } from '@/lib/db/artists'
import { notFound } from 'next/navigation'

interface ArtistParams {
    id: string
}

// Pré-génère les artistes visibles ; les autres sont rendus à la demande puis
// cachés (dynamicParams par défaut). Revalidation par tag `artist:${id}` sur
// modif back-office + fallback quotidien.
export async function generateStaticParams(): Promise<ArtistParams[]> {
    const ids = await getVisibleArtistIds()
    return ids.map(id => ({ id }))
}

export const revalidate = 86400

export default async function ArtistPage(props: {
    params: Promise<ArtistParams>
}) {
    const { id } = await props.params
    const artist = await getArtistById(id)

    if (!artist) notFound()

    return (
        <div className='w-full min-h-full flex flex-col gap-8 p-6 md:p-10 bg-white-oldlace'>
            <div className='w-full bg-purple-light/10 rounded-lg mt-8'>
                <div className='flex gap-6 flex-col md:flex-row'>
                    <div className='relative w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0'>
                        {artist.contents?.[0]?.url && (
                            <S3Image
                                src={artist.contents[0].url}
                                alt={artist.name}
                                fill
                                className='object-cover w-full h-full'
                            />
                        )}
                    </div>
                    <div className='flex flex-col flex-grow gap-4'>
                        <div className='flex justify-start items-center gap-4'>
                            <h1 className='text-3xl font-bold'>{artist.name}</h1>
                            <UpdateButton
                                href={`/dashboard?id=${artist.id}&type=artist&mode=update`}
                            />
                        </div>
                        <p className='text-gray-600'>
                            {artist.description || 'No description available'}
                        </p>
                        <div className='mt-auto'>
                            <span className='text-purple-dark font-medium'>
                                {artist.tablatures.length} tablature
                                {artist.tablatures.length !== 1 ? 's' : ''}{' '}
                                available
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className='w-full mt-10'>
                <h2 className='text-2xl font-semibold mb-6'>Tablatures</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {artist.tablatures.map(tab => (
                        <TablatureCard
                            key={tab.id}
                            tablature={tab}
                            artist={artist}
                            showLetterOverlay={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
