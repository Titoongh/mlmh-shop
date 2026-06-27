'use client'

import { useEffect } from 'react'

// Frontière d'erreur racine : remplace le layout (doit définir <html>/<body>).
// Ne s'affiche que si l'erreur survient dans le layout racine lui-même.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <html lang='en'>
            <body>
                <div
                    style={{
                        display: 'flex',
                        minHeight: '100vh',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        padding: '2.5rem',
                        textAlign: 'center',
                        fontFamily: 'sans-serif',
                    }}
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        Something went wrong
                    </h2>
                    <p style={{ maxWidth: '28rem', color: '#4b5563' }}>
                        A critical error occurred. Please try again.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            border: '2px solid black',
                            borderRadius: '9999px',
                            padding: '0.5rem 2rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
