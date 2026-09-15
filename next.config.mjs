/** @type {import('next').NextConfig} */
const ROOT_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; frame-src 'self' blob:; img-src 'self' data: blob:;"

const GAME_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob:; frame-ancestors 'self';"

const nextConfig = {
  // Route handlers persist to local Postgres, so this cannot be a static
  // `output: 'export'` app. `pnpm dev` / `pnpm start` run a Node server.
  serverExternalPackages: ['pg'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy', value: ROOT_CSP }],
      },
      {
        source: '/game-build/:path*',
        headers: [{ key: 'Content-Security-Policy', value: GAME_CSP }],
      },
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
