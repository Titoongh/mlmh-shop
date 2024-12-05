// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    // output: 'standalone',
    // experimental: {
    //     outputFileTracingRoot: undefined,
    // },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: '/api/static/:path*',
            },
        ]
    },
}

export default nextConfig
