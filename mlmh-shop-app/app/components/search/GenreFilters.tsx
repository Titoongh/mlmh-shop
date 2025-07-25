import { MusicalGenre } from '@prisma/client'
import { Tag } from '../Buttons'

interface GenreFiltersProps {
    availableGenres: MusicalGenre[]
    selectedGenres: MusicalGenre[]
    onGenreSelect: (genre: MusicalGenre) => void
    onGenreRemove: (genre: MusicalGenre) => void
}

export default function GenreFilters({
    availableGenres,
    selectedGenres,
    onGenreSelect,
    onGenreRemove,
}: GenreFiltersProps) {
    return (
        <div className='flex justify-center'>
            <div className='w-[50vw] min-w-[300px] max-w-[600px] flex flex-row gap-2 flex-wrap'>
                {selectedGenres.map(genre => (
                    <Tag
                        key={genre.id}
                        color='green'
                        onClick={() => onGenreRemove(genre)}
                    >
                        <div className='flex items-center gap-2'>
                            {genre.name}
                            <span className='text-sm'>×</span>
                        </div>
                    </Tag>
                ))}
                {availableGenres
                    .filter(genre => !selectedGenres.includes(genre))
                    .map(genre => (
                        <Tag
                            key={genre.id}
                            color='default'
                            onClick={() => onGenreSelect(genre)}
                        >
                            {genre.name}
                        </Tag>
                    ))}
            </div>
        </div>
    )
}
