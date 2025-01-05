import { NextResponse } from 'next/server'
import { verifyAuth } from './auth'

export function withAuth(handler: Function) {
    return async function (request: Request, ...args: any[]) {
        try {
            await verifyAuth()
            return handler(request, ...args)
        } catch (error) {
            console.log('error', error)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }
}

// export function withAuth(handler: Function) {
//     return async function (request: Request, ...args: any[]) {
//         try {
//             // await verifyAuth()
//             return handler(request, ...args)
//         } catch (error) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//         }
//     }
// }
