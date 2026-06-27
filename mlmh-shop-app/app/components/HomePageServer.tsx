import { getHomeRecommendations } from '@/lib/db/tablatures'
import HomePageClient from './HomePageClient'

export default async function HomePageServer() {
    const recommendations = await getHomeRecommendations()

    return <HomePageClient initialRecommendations={recommendations} />
}
