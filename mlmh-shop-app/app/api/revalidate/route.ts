import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { checkApiKey } from '@/lib/db/auth'

// Régénère les pages/données statiques avec les vraies données. Deux usages :
//   1. Au démarrage du conteneur (docker-entrypoint.sh) : les pages SSG lisant la
//      DB ont été pré-rendues VIDES au build (garde NEXT_PHASE, pas de DB au
//      build). On les régénère dès que le serveur répond.
//   2. Sur webhook/back-office après une mutation.
//
// Protégé par clé d'API (`x-api-key`) — voir lib/db/auth.ts.

// Chemins SSG qui lisent la DB et doivent être régénérés au démarrage.
const STATIC_PATHS = ['/', '/search', '/methods']
// Tags de cache à invalider (doivent matcher ceux de lib/db/*).
const TAGS = ['tablatures', 'artists', 'musical-genres', 'methods']

export async function POST(req: Request) {
    if (!process.env.REVALIDATE_API_KEY) {
        return NextResponse.json(
            { error: 'Server misconfiguration' },
            { status: 500 },
        )
    }
    if (!checkApiKey(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    for (const tag of TAGS) revalidateTag(tag, {})
    for (const path of STATIC_PATHS) revalidatePath(path)

    return NextResponse.json({ revalidated: { paths: STATIC_PATHS, tags: TAGS } })
}
