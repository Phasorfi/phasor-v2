/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Polyfill indexedDB for server-side rendering
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'fake-indexeddb': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
