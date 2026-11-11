import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Astro Bunny Game',
    short_name: 'Astro Bunny',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#0A0E14',
    theme_color: '#0A0E14',
    icons: [
      {
        src: '/icons/icon-768.png',
        sizes: '768x768',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
