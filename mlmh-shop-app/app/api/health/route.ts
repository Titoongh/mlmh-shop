import { NextResponse } from 'next/server'

// Liveness pure : confirme seulement que le serveur Next répond. NE touche PAS la
// DB — sinon un hoquet Accelerate ferait échouer le healthcheck Swarm et tuerait
// le conteneur en boucle. Utilisé par docker-compose.swarm.yml.
export const dynamic = 'force-dynamic'

export function GET() {
    return NextResponse.json({ status: 'ok' })
}
