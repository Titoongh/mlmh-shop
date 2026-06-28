// Site-wide default Open Graph image. Auto-generated at request time by Next.js's
// file-based Metadata convention (next/og ImageResponse), so no static asset needs
// to be committed. This 1200x630 image is the fallback social-share thumbnail for
// every page that doesn't export its own opengraph-image (home, search, etc.).
// Runtime is left at the default (nodejs) on purpose so it composes with the
// project's webpack node config; no external fonts are fetched (no network call).

import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

export const alt = 'Michel Lelong Guitar Tab Workshop — Guitar tablatures'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: '96px',
                    background:
                        'linear-gradient(135deg, #2e1065 0%, #4c1d95 38%, #1a0b3d 72%, #0a0612 100%)',
                    color: '#ffffff',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        fontSize: 32,
                        fontWeight: 600,
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        color: '#c4b5fd',
                    }}
                >
                    Guitar Tab Workshop
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: 28,
                        fontSize: 96,
                        fontWeight: 800,
                        lineHeight: 1.05,
                        color: '#ffffff',
                    }}
                >
                    {SITE_NAME}
                </div>
                <div
                    style={{
                        display: 'flex',
                        width: 220,
                        height: 8,
                        marginTop: 40,
                        borderRadius: 4,
                        background:
                            'linear-gradient(90deg, #a855f7 0%, #c4b5fd 100%)',
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        marginTop: 36,
                        fontSize: 40,
                        fontWeight: 400,
                        color: '#ddd6fe',
                    }}
                >
                    Guitar tablatures · methods · video lessons
                </div>
            </div>
        ),
        { ...size },
    )
}
