import { Dispatch, SetStateAction } from 'react'
import Input from '../Input'

interface SearchInputProps {
    searchQuery: string
    setSearchQuery: Dispatch<SetStateAction<string>>
}

export default function SearchInput({
    searchQuery,
    setSearchQuery,
}: SearchInputProps) {
    return (
        <Input
            placeholder='Search artists or tablatures...'
            value={searchQuery}
            setValue={setSearchQuery}
            className='w-[50vw] min-w-[300px] max-w-[600px]'
        />
    )
}
