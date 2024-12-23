import { auth } from './firebase/config'

export async function getAuthToken(): Promise<string | null> {
    const currentUser = auth.currentUser
    if (!currentUser) {
        return null
    }

    try {
        const token = await currentUser.getIdToken()
        return token
    } catch (error) {
        console.error('Error getting auth token:', error)
        return null
    }
}

export async function authenticatedFetch(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    const token = await getAuthToken()

    const headers = {
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
    }

    return fetch(url, {
        ...options,
        headers,
    })
}
