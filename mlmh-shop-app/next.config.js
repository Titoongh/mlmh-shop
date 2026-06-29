/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Plafonne les variantes générées (moins de transformations à la volée).
        deviceSizes: [384, 640, 750, 828, 1080],
        imageSizes: [128, 256],
        formats: ['image/webp'],
        // Garde les variantes optimisées en cache 30 jours (les URLs sources sont
        // immuables : clé S3 horodatée → pas de risque de stale). Évite de
        // re-générer l'image LCP à chaque expiration (moins de CPU + 1er hit rapide).
        minimumCacheTTL: 2592000,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*',
            },
            {
                protocol: 'http',
                hostname: '*',
            },
            {
                protocol: 'https',
                hostname: '*.s3.fr-par.scw.cloud',
            },
            {
                protocol: 'https',
                hostname: 's3.fr-par.scw.cloud',
            },
        ],
    },
    devIndicators: {
        position: 'bottom-right',
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                stream: require.resolve('stream-browserify'),
                buffer: require.resolve('buffer'),
                util: require.resolve('util/'),
                crypto: require.resolve('crypto-browserify'),
                http: require.resolve('stream-http'),
                https: require.resolve('https-browserify'),
                os: require.resolve('os-browserify/browser'),
                url: require.resolve('url/'),
                zlib: require.resolve('browserify-zlib'),
                path: require.resolve('path-browserify'),
                fs: false,
                net: false,
                tls: false,
                // ...config.resolve.fallback,
                // stream: require.resolve('stream-browserify'),
                // buffer: require.resolve('buffer'),
            }
        }
        return config
    },
    async rewrites() {
        return [
            {
                source: '/api/static/:path*',
                destination: '/api/storage/:path*',
            },
            {
                source: '/public/uploads/:path*',
                destination: '/api/storage/:path*',
            },
            {
                source: '/public/storage/:path*',
                destination: '/api/storage/:path*',
            },
        ]
    },
}

module.exports = nextConfig
