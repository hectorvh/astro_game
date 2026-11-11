'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/jerboa/session-context'

const SPLASH_MS = 1500

export const SPLASH_LOGO_SRCS = [
  '/images/brand/SCALA_logo.png',
  '/images/brand/EU_co_logoV2.png',
  '/images/brand/UKRI_logoV2.png',
] as const

const LOGOS = {
  scala: {
    src: '/images/brand/SCALA_logo.png',
    alt: 'SCALA — Spatial Communication and Ageing across Languages',
  },
  eu: {
    src: '/images/brand/EU_co_logoV2.png',
    alt: 'European Union',
  },
  ukri: {
    src: '/images/brand/UKRI_logoV2.png',
    alt: 'UK Research and Innovation',
  },
} as const

const SPLASH_CSS = `
@keyframes astro-splash-fade {
  0% { opacity: 0; }
  16.6667% { opacity: 1; }
  83.3333% { opacity: 1; }
  100% { opacity: 0; }
}
.astro-splash-fade {
  opacity: 0;
  animation: astro-splash-fade 1500ms linear both;
}
@media (prefers-reduced-motion: reduce) {
  main.astro-splash-fade {
    animation-name: none !important;
    animation-duration: 0s !important;
    opacity: 1 !important;
  }
}
`

function SplashLogo({
  src,
  alt,
  className,
  failed,
  onFail,
}: {
  src: string
  alt: string
  className: string
  failed: boolean
  onFail: (src: string) => void
}) {
  if (failed) {
    return (
      <p className="max-w-[80vw] text-center text-[20px] leading-snug text-white">{alt}</p>
    )
  }
  return <img src={src} alt={alt} className={className} onError={() => onFail(src)} />
}

export function SplashScreen({ variant }: { variant: 'scala' | 'funders' }) {
  const { goTo } = useSession()
  const [failed, setFailed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const next = variant === 'scala' ? 'splash-funders' : 'welcome'
    const timer = window.setTimeout(() => goTo(next), SPLASH_MS)
    return () => window.clearTimeout(timer)
  }, [variant, goTo])

  function onFail(src: string) {
    console.warn(src)
    setFailed((prev) => (prev[src] ? prev : { ...prev, [src]: true }))
  }

  const label = variant === 'scala' ? 'SCALA project' : 'Project partners'

  return (
    <main
      key={variant}
      aria-label={label}
      className="astro-splash-fade flex min-h-dvh w-full items-center justify-center bg-[#0A0E14] bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/Gemini_Generated_Image_gjhy10gjhy10gjhy.jpeg')",
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingRight: 'max(24px, env(safe-area-inset-right))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(24px, env(safe-area-inset-left))',
      }}
    >
      <style>{SPLASH_CSS}</style>
      {variant === 'scala' ? (
        <SplashLogo
          src={LOGOS.scala.src}
          alt={LOGOS.scala.alt}
          className="max-h-[min(40vh,280px)] max-w-[80vw] object-contain"
          failed={!!failed[LOGOS.scala.src]}
          onFail={onFail}
        />
      ) : (
        <div className="mx-auto flex w-[min(78vw,440px)] flex-col items-center gap-10">
          <SplashLogo
            src={LOGOS.eu.src}
            alt={LOGOS.eu.alt}
            className="h-auto w-full object-contain"
            failed={!!failed[LOGOS.eu.src]}
            onFail={onFail}
          />
          <SplashLogo
            src={LOGOS.ukri.src}
            alt={LOGOS.ukri.alt}
            className="h-auto w-full object-contain"
            failed={!!failed[LOGOS.ukri.src]}
            onFail={onFail}
          />
        </div>
      )}
    </main>
  )
}
