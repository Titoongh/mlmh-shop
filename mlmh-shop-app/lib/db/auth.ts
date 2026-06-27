// Auth par clé d'API pour les endpoints "machine" (revalidation au démarrage,
// webhooks). Le client envoie l'en-tête `x-api-key` ; on compare à la variable
// d'env `REVALIDATE_API_KEY`. Si la clé serveur n'est pas configurée, on REFUSE
// par défaut (fail-closed) plutôt que d'ouvrir l'endpoint.
export function checkApiKey(req: Request): boolean {
    if (!process.env.REVALIDATE_API_KEY) return false
    return req.headers.get('x-api-key') === process.env.REVALIDATE_API_KEY
}
