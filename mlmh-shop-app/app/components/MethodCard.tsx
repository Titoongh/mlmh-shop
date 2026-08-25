import Link from 'next/link'
import SmartImage from '@/app/components/SmartImage'
import { MethodSummary } from '@/app/types/types'
import { formatPrice } from '@/lib/utils'
import { methodPath } from '@/lib/slug'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookOpen, faFilePdf, faMusic } from '@fortawesome/free-solid-svg-icons'

// Catalog card for a guitar method. Deliberately much bigger/richer than
// TablatureCard (portrait cover, description snippet, lesson count) so
// methods read as a distinct, higher-value product on the same grids.
export const MethodCard = ({
    method,
    index = 0,
}: {
    method: MethodSummary
    index?: number
}) => {
    const coverUrl =
        method.contents?.find(c => c.type === 'IMAGE' && c.url)?.url ||
        method.artists?.[0]?.contents?.find(c => c.type === 'IMAGE' && c.url)
            ?.url

    const prices = method.offers?.map(offer => offer.price) ?? []
    const minPrice = prices.length > 0 ? Math.min(...prices) : null
    const lessonCount = method._count.lessons

    return (
        <Link
            href={methodPath(method)}
            className='group w-full bg-purple-dark/5 rounded-lg overflow-hidden hover:shadow-lg transition-shadow border-2 border-black flex flex-col'
        >
            <div className='relative w-full aspect-[3/4] bg-purple-dark/10 overflow-hidden'>
                {coverUrl ? (
                    <SmartImage
                        src={coverUrl}
                        alt={method.title}
                        fill
                        sizes='(max-width: 768px) 100vw, 400px'
                        className='object-cover w-full h-full object-center transition-transform group-hover:scale-105'
                        priority={index < 3}
                    />
                ) : (
                    <div className='w-full h-full bg-gradient-to-br from-purple-dark/20 to-purple-dark/40 flex items-center justify-center'>
                        <span className='text-purple-dark text-4xl font-bold'>
                            {method.title.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                <span className='absolute top-3 left-3 bg-purple-dark text-white text-xs font-bold uppercase tracking-wide px-2 py-1 rounded'>
                    Guitar method
                </span>
            </div>
            <div className='flex flex-col flex-grow gap-3 p-5'>
                <div>
                    <h3 className='text-xl font-bold line-clamp-2'>
                        {method.title}
                    </h3>
                    {method.artists?.[0] && (
                        <p className='text-sm text-gray-600'>
                            by {method.artists[0].name}
                        </p>
                    )}
                </div>

                {method.description && (
                    <p className='text-sm text-gray-600 line-clamp-3'>
                        {method.description}
                    </p>
                )}

                <div className='flex items-center gap-4 text-sm text-gray-500'>
                    {lessonCount > 0 && (
                        <span className='flex items-center gap-1.5'>
                            <FontAwesomeIcon icon={faBookOpen} />
                            {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                        </span>
                    )}
                    <span className='flex items-center gap-1.5'>
                        <FontAwesomeIcon icon={faFilePdf} />
                        PDF
                    </span>
                    <span className='flex items-center gap-1.5'>
                        <FontAwesomeIcon icon={faMusic} />
                        Audio
                    </span>
                </div>

                {method.musicalGenres && method.musicalGenres.length > 0 && (
                    <p className='text-xs text-gray-500'>
                        Genres:{' '}
                        {method.musicalGenres
                            .map(genre => genre.name)
                            .join(', ')}
                    </p>
                )}

                <div className='flex items-center justify-between gap-2 mt-auto pt-2 border-t border-purple-dark/10'>
                    {minPrice !== null && (
                        <span className='text-lg text-purple-dark font-bold'>
                            From {formatPrice(minPrice)}
                        </span>
                    )}
                    <span className='text-sm font-semibold text-purple-dark group-hover:underline'>
                        View method →
                    </span>
                </div>
            </div>
        </Link>
    )
}

export default MethodCard
