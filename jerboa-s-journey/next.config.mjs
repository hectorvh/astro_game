/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every screen is a client component and there are no route handlers, server
  // actions or middleware, so the instrument builds to plain files. This keeps
  // the deploy a static upload with no serverless functions behind it.
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
