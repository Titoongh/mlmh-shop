import { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotate, faSearch } from '@fortawesome/free-solid-svg-icons'

type Props = {
    className?: ClassValue
    value: string
    setValue: React.Dispatch<React.SetStateAction<string>>
    placeholder: string
    showLoopIcon?: boolean
    onLoopClick?: () => void
}

export default function Input({
    className,
    value,
    setValue,
    placeholder,
    onLoopClick,
}: Props) {
    return (
        <div className='relative flex items-center w-full'>
            <button
                className='absolute left-4 text-black hover:text-gray-700 focus:outline-none z-10'
                onClick={onLoopClick}
                aria-label='Refresh'
                type='button'
            >
                <FontAwesomeIcon icon={faSearch} color='black' />
            </button>
            <input
                className={cn(
                    'rounded-full bg-white border-2 border-black p-[10px] pl-[40px] font-base ring-offset-white focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none w-full',
                    className,
                )}
                type='text'
                name='text'
                placeholder={placeholder}
                value={value}
                onChange={e => {
                    setValue(e.target.value)
                }}
                aria-label={placeholder}
            />
        </div>
    )
}
