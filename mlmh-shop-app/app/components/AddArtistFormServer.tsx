import { prisma } from '@/app/prisma'
import AddArtistFormClient from './AddArtistFormClient'
import type {
    AddArtistFormProps,
    FormDataResponse,
    ComponentMode,
} from './AddArtistForm.types'

export const dynamic = 'force-dynamic'

// Server-side data fetching with proper error handling
async function getFormData(
    id?: string | null,
    mode?: ComponentMode,
): Promise<FormDataResponse> {
    try {
        const [musicalGenres, artist] = await Promise.all([
            // Get all musical genres
            prisma.musicalGenre.findMany({
                orderBy: { name: 'asc' },
            }),
            // Get artist data if updating
            mode === 'update' && id
                ? prisma.artist.findUnique({
                      where: { id },
                      include: {
                          contents: {
                              orderBy: { rank: 'asc' },
                          },
                          musicalGenres: true,
                      },
                  })
                : Promise.resolve(null),
        ])

        return {
            musicalGenres,
            artist,
        }
    } catch (error) {
        console.error('Error fetching form data:', error)
        // Return empty data in case of error
        return {
            musicalGenres: [],
            artist: null,
        }
    }
}

export default async function AddArtistFormServer({
    id,
    mode = 'create',
    onSuccess,
}: AddArtistFormProps) {
    const { musicalGenres, artist } = await getFormData(id, mode)

    return (
        <AddArtistFormClient
            id={id}
            mode={mode}
            {...(onSuccess && { onSuccess })}
            initialMusicalGenres={musicalGenres}
            initialArtist={artist}
        />
    )
}
