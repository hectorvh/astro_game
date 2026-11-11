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
/* Padding shared by <main> and the size math below. */
.astro-splash {
  --splash-pad-top: max(24px, env(safe-area-inset-top));
  --splash-pad-bottom: max(24px, env(safe-area-inset-bottom));
  --splash-gap: 40px;
  padding: var(--splash-pad-top) max(24px, env(safe-area-inset-right))
    var(--splash-pad-bottom) max(24px, env(safe-area-inset-left));
}
@media (max-height: 499.98px) {
  .astro-splash { --splash-gap: 16px; }
}
/* EU (768x808) above UKRI (768x226) at one shared width: total height is
   width * (808 + 226) / 768 = width * 1.346, plus the gap. */
.astro-splash-funders {
  gap: var(--splash-gap);
  width: min(
    78vw,
    440px,
    (100dvh - var(--splash-pad-top) - var(--splash-pad-bottom) - var(--splash-gap)) / 1.346
  );
}
.astro-splash-scala {
  max-width: 80vw;
  max-height: min(40dvh, 280px);
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
  // eslint-disable-next-line @next/next/no-img-element -- static brand logo, images.unoptimized
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
      className="astro-splash astro-splash-fade space-bg flex h-dvh w-full items-center justify-center overflow-hidden"
    >
      <style>{SPLASH_CSS}</style>
      {variant === 'scala' ? (
        <SplashLogo
          src={LOGOS.scala.src}
          alt={LOGOS.scala.alt}
          className="astro-splash-scala h-auto w-auto object-contain"
          failed={!!failed[LOGOS.scala.src]}
          onFail={onFail}
        />
      ) : (
        <div className="astro-splash-funders mx-auto flex flex-col items-center">
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
