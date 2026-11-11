/** @type {import('next').NextConfig} */
// One policy for every route. Two Content-Security-Policy headers are AND-ed
// by the browser, so a second stricter rule would block Unity's eval/WASM.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self' blob:",
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https: wss:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self' blob:",
  "media-src 'self' blob:",
  "frame-ancestors 'self'",
].join('; ')

const nextConfig = {
  // Route handlers persist to local Postgres, so this cannot be a static
  // `output: 'export'` app. `pnpm dev` / `pnpm start` run a Node server.
  serverExternalPackages: ['pg'],
  devIndicators: false,
  experimental: {
    // The default dev cache was storing the Unity builds and 3D dumps
    // (about 1 GB, and it kept growing). That made `pnpm dev` hang and
    // pushed Cursor out of memory.
    turbopackFileSystemCacheForDev: false,
    turbopackMemoryLimit: 1024 * 1024 * 1024,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  async headers() {
    const csp =
      process.env.NODE_ENV === 'development'
        ? []
        : [
            {
              source: '/',
              headers: [{ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }],
            },
            {
              source: '/:path*',
              headers: [{ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }],
            },
          ]

    return [
      ...csp,
      {
        source: '/game-build/:path*.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/game-build/:path*.data',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
