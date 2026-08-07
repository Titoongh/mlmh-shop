import { auth } from '@clerk/nextjs/server'

// Garde d'accès admin, appelée DANS chaque server action et dans le layout
// /admin — défense en profondeur en plus du middleware (proxy.ts). Les server
// actions sont des endpoints HTTP à part entière : on ne se repose jamais
// uniquement sur le middleware pour les protéger.
export async function isAdmin(): Promise<boolean> {
    try {
        const { has } = await auth()
        return has({ role: 'org:admin' })
    } catch {
        return false
    }
}

export async function requireAdmin(): Promise<void> {
    if (!(await isAdmin())) {
        throw new Error('Accès refusé : réservé aux administrateurs.')
    }
}
