/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*',
            },
            {
                protocol: 'http',
                hostname: '*',
            },
        ],
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
                source: '/uploads/:path*',
                destination: '/api/static/:path*',
            },
        ]
    },
}

module.exports = nextConfig
