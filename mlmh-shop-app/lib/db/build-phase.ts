// Build sans base de données (garde NEXT_PHASE).
//
// Le build de prod (CI/Docker) n'a souvent pas de DB joignable. Pendant
// `next build`, Next expose NEXT_PHASE='phase-production-build'. On détecte cette
// phase et on renvoie une valeur VIDE sans toucher Prisma → le build passe et les
// pages restent statiques. Elles sont régénérées avec les vraies données au
// premier accès runtime (ou via POST /api/revalidate au démarrage du conteneur).
//
// ⚠️ Toujours appeler isBuildPhase() À L'EXTÉRIEUR de unstable_cache. Si la garde
// était DEDANS, le build écrirait la valeur vide (avec ses tags) dans le cache de
// données embarqué dans `.next` → au runtime une revalidation resservirait ce vide.
// Dehors → aucune entrée créée au build → 1er accès runtime = miss = vraie requête.
export function isBuildPhase(): boolean {
    return process.env.NEXT_PHASE === 'phase-production-build'
}
