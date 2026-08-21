import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Self-hosted (OFL, see ./fonts/*-OFL.txt) so builds and page loads never
// depend on Google Fonts. Latin-subset variable files.
const nunito = localFont({
  src: [
    {
      path: './fonts/nunito-latin-variable.woff2',
      weight: '200 1000',
      style: 'normal',
    },
    {
      path: './fonts/nunito-latin-italic-variable.woff2',
      weight: '200 1000',
      style: 'italic',
    },
  ],
  variable: '--font-nunito',
  display: 'swap',
})

const baloo = localFont({
  src: [
    {
      path: './fonts/baloo-2-latin-variable.woff2',
      weight: '400 800',
      style: 'normal',
    },
  ],
  variable: '--font-baloo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Laika Odyssey: A Spatial Adventure',
  description:
    'A gamified spatial-language research instrument. Help Laika fly toward Jupiter while taking part in the SCALA study.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0c1220',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${baloo.variable} bg-background`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
