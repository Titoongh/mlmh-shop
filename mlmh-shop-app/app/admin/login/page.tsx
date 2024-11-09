'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            })

            if (response.ok) {
                router.push('/admin')
            } else {
                setError('Invalid password')
            }
        } catch (err) {
            setError('An error occurred')
        }
    }

    return (
        <div className='w-full min-h-full flex flex-col justify-center items-center bg-white-oldlace p-10'>
            <div className='max-w-md w-full space-y-8'>
                <h2 className='text-3xl font-bold text-center'>Admin Login</h2>
                {error && <p className='text-red text-center'>{error}</p>}
                <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
                    <input
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className='w-full px-4 py-2 border-2 border-black rounded'
                        placeholder='Enter admin password'
                    />
                    <button
                        type='submit'
                        className='w-full bg-purple-dark text-white py-2 px-4 rounded hover:bg-purple-medium transition-colors'
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}
