export interface ProcessedContents {
    type: ContentFormData['type']
    url: string
    rank: number
}

export interface ContentFormData {
    type: 'AUDIO' | 'VIDEO' | 'IMAGE'
    url?: string
    file?: File | undefined
    rank: number
    uploadType: 'url' | 'file'
}

export interface ContentItemProps {
    content: ContentFormData
    onUpdate: (data: Partial<ContentFormData>) => void
    onRemove: () => void
    imageOnly?: boolean
}

export function ContentItem({
    content,
    onUpdate,
    onRemove,
    imageOnly,
}: ContentItemProps) {
    return (
        <div className='border-2 border-black p-4 rounded space-y-4'>
            {!imageOnly && (
                <div className='flex justify-between'>
                    <select
                        value={content.type}
                        onChange={e =>
                            onUpdate({
                                type: e.target.value as ContentFormData['type'],
                            })
                        }
                        className='px-4 py-2 border-2 border-black rounded'
                    >
                        <option value='IMAGE'>Image</option>
                        <option value='AUDIO'>Audio</option>
                        <option value='VIDEO'>Video</option>
                    </select>
                    <button
                        type='button'
                        onClick={onRemove}
                        className='text-red-600'
                    >
                        Remove
                    </button>
                </div>
            )}
            <div className='flex gap-4'>
                <label className='flex items-center gap-2'>
                    <input
                        type='radio'
                        checked={content.uploadType === 'url'}
                        onChange={() => onUpdate({ uploadType: 'url' })}
                    />
                    URL
                </label>
                <label className='flex items-center gap-2'>
                    <input
                        type='radio'
                        checked={content.uploadType === 'file'}
                        onChange={() => onUpdate({ uploadType: 'file' })}
                    />
                    File Upload
                </label>
            </div>

            {content.uploadType === 'url' ? (
                <input
                    type='text'
                    value={content.url || ''}
                    onChange={e => onUpdate({ url: e.target.value })}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                    placeholder='Enter URL'
                />
            ) : (
                <input
                    type='file'
                    accept={
                        content.type === 'IMAGE'
                            ? 'image/*'
                            : content.type === 'AUDIO'
                            ? 'audio/*'
                            : 'video/*'
                    }
                    onChange={e => onUpdate({ file: e.target.files?.[0] })}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                />
            )}

            <div className='flex gap-4 items-center'>
                <label>Ranking</label>
                <input
                    type='number'
                    value={content.rank}
                    onChange={e => onUpdate({ rank: parseInt(e.target.value) })}
                    className='w-full px-4 py-2 border-2 border-black rounded'
                    placeholder='Rank'
                />
            </div>
        </div>
    )
}

export const processContents = async (
    contents: ContentFormData[],
): Promise<ProcessedContents[]> => {
    // Handle file uploads first if any
    const contentPromises = contents.map(async (content, index) => {
        if (content.file) {
            const formData = new FormData() // Create new FormData for each file
            formData.append('file', content.file) // Use 'file' as the key

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`Upload failed for content ${index + 1}`)
            }

            const { url } = await response.json()
            return {
                type: content.type,
                url,
                rank: content.rank,
            }
        }

        return {
            type: content.type,
            url: content.url,
            rank: content.rank,
        }
    })

    return Promise.all(contentPromises)
}
