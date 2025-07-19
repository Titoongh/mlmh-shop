import { prisma } from '@/app/prisma'
import AddTablatureFormClient from './AddTablatureFormClient'
import type {
    AddTablatureFormProps,
    FormDataResponse,
    ComponentMode,
} from './AddTablatureForm.types'

export const dynamic = 'force-dynamic'

// Server-side data fetching with proper error handling
async function getFormData(
    id?: string | null,
    mode?: ComponentMode,
): Promise<FormDataResponse> {
    try {
        const [artists, musicalGenres, tablature] = await Promise.all([
            // Get all artists for admin (including hidden ones)
            prisma.artist.findMany({
                include: {
                    contents: true,
                    musicalGenres: true,
                },
                orderBy: { name: 'asc' },
            }),
            // Get all musical genres
            prisma.musicalGenre.findMany({
                orderBy: { name: 'asc' },
            }),
            // Get tablature data if updating
            mode === 'update' && id
                ? prisma.tablature.findUnique({
                      where: { id },
                      include: {
                          artists: true,
                          musicalGenres: true,
                          contents: {
                              orderBy: { rank: 'asc' },
                          },
                          files: true,
                      },
                  })
                : Promise.resolve(null),
        ])

        return {
            artists,
            musicalGenres,
            tablature,
        }
    } catch (error) {
        console.error('Error fetching form data:', error)
        // Return empty data in case of error
        return {
            artists: [],
            musicalGenres: [],
            tablature: null,
        }
    }
}

export default async function AddTablatureFormServer({
    id,
    mode = 'create',
}: AddTablatureFormProps) {
    const { artists, musicalGenres, tablature } = await getFormData(id, mode)

    return (
        <AddTablatureFormClient
            id={id}
            mode={mode}
            initialArtists={artists}
            initialMusicalGenres={musicalGenres}
            initialTablature={tablature}
        />
    )
}
