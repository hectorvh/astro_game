/** @type {import('next').NextConfig} */
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
}

export default nextConfig
