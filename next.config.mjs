/** @type {import('next').NextConfig} */
// Keep this string identical to netlify.toml [[headers]]. The browser ANDs
// every Content-Security-Policy header, so a second stricter copy would block
// Unity's eval/WASM. 'unsafe-eval' is required by the Unity WebGL loader.
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
  'upgrade-insecure-requests',
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
    // On Netlify, CSP comes only from netlify.toml so the browser sees a
    // single policy (two CSP headers are AND-ed and a mismatch blocks Unity).
    // Elsewhere (`next start`), this header is the sole CSP source.
    const csp =
      process.env.NODE_ENV === 'development' || process.env.NETLIFY
        ? []
        : [
            {
              source: '/:path*',
              headers: [{ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }],
            },
          ]

    return [
      ...csp,
      // Unity Brotli files (same rules as netlify.toml). Content-Encoding makes the
      // browser decompress them; Unity's loader then sees plain data.
      ...[
        ['wasm', 'application/wasm'],
        ['data', 'application/octet-stream'],
        ['js', 'application/javascript'],
      ].map(([ext, type]) => ({
        source: `/game-build/Build/:file(.+\\.${ext}\\.br)`,
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: type },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      })),
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
