import { adminAuth } from './admin'
import { auth } from './config'
import { headers } from 'next/headers'

export async function verifyAuth() {
    try {
        const headersList = headers()
        console.log('headersList', headersList)
        const token = headersList.get('Authorization')?.split('Bearer ')[1]

        if (!token) {
            throw new Error('No token provided')
        }

        const decodedToken = await adminAuth.verifyIdToken(token)
        const ownerEmail = 'lelongmartin@gmail.com'
        const ownerUID = 'Be5blNaKwwT8tAjxezDbWVdXWZH3'

        if (
            decodedToken.email !== ownerEmail &&
            decodedToken.uid !== ownerUID
        ) {
            throw new Error('Unauthorized')
        }
        return decodedToken
    } catch (error) {
        throw new Error('Authentication failed')
    }
}
