/** @type {import('next').NextConfig} */

// Unity WebGL (and the 3D viewer) compile WASM / use eval-style helpers.
// Without these sources Chrome blocks the minigame under script-src.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self' blob: data: https:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

const cspHeader = { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }

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
  outputFileTracingExcludes: {
    '*': [
      './android/**',
      './ios/**',
      './game-buildV7/**',
      './public/3d/bunny3D/**',
      './public/3d/laika3D/**',
      './public/dev/**',
      './node_modules/@capacitor/**',
      './node_modules/supabase/**',
    ],
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [cspHeader],
      },
      {
        source: '/:path*',
        headers: [cspHeader],
      },
      {
        source: '/game-build/:path*',
        headers: [cspHeader],
      },
      {
        source: '/game-build/:path*.wasm.br',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/game-build/:path*.data.br',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/game-build/:path*.js.br',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
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
