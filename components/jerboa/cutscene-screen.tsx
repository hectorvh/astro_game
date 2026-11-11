'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, SkipForward } from 'lucide-react'
import { useAudioPrefs } from '@/lib/jerboa/audio-prefs'

type CutsceneScreenProps = {
  src: string
  label: string
  onDone: () => void
}

/** null = playing (or starting), 'blocked' = autoplay refused, 'reduced' = waiting by choice. */
type Prompt = null | 'blocked' | 'reduced'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const PRIMARY_BTN =
  'hud-focus inline-flex min-h-[64px] min-w-[240px] items-center justify-center gap-3 rounded-full bg-hud-cyan px-8 font-hud-display text-[24px] font-bold text-hud-bg'

const SECONDARY_BTN =
  'hud-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-hud-cyan-dim bg-hud-panel px-5 font-hud-mono text-[14px] uppercase tracking-[0.12em] text-hud-ink transition-colors hover:border-hud-amber hover:text-hud-amber motion-reduce:transition-none'

/** Full-screen video shown after a level. Never cropped; always skippable. */
export function CutsceneScreen({ src, label, onDone }: CutsceneScreenProps) {
  const { muted } = useAudioPrefs()
  const videoRef = useRef<HTMLVideoElement>(null)
  const doneRef = useRef(false)
  const mutedRef = useRef(muted)
  const [reduce] = useState(prefersReducedMotion)
  const [prompt, setPrompt] = useState<Prompt>(reduce ? 'reduced' : null)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    mutedRef.current = muted
    const video = videoRef.current
    if (video) video.muted = muted
  }, [muted])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduce) return
    let cancelled = false
    video.muted = mutedRef.current
    video.play().catch(() => {
      if (!cancelled) setPrompt('blocked')
    })
    return () => {
      cancelled = true
    }
  }, [reduce])

  function playFromTap() {
    const video = videoRef.current
    if (!video) return
    video.muted = mutedRef.current
    setPrompt(null)
    video.play().catch(() => finish())
  }

  return (
    <main
      aria-label={label}
      className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        // The time fragment makes iOS paint the first frame when not autoplaying.
        src={reduce ? `${src}#t=0.001` : src}
        playsInline
        preload={reduce ? 'metadata' : 'auto'}
        disablePictureInPicture
        onEnded={finish}
        onError={finish}
        aria-label={label}
      />

      {prompt ? (
        <div className="relative z-10 flex flex-col items-center gap-4 px-6">
          <button type="button" onClick={playFromTap} className={PRIMARY_BTN}>
            <Play className="size-7" aria-hidden="true" />
            Play video
          </button>
          {prompt === 'reduced' ? (
            <button type="button" onClick={finish} className={SECONDARY_BTN}>
              Continue to menu
            </button>
          ) : null}
        </div>
      ) : null}

      {prompt !== 'reduced' ? (
        <button
          type="button"
          onClick={finish}
          aria-label="Skip video"
          className={`${SECONDARY_BTN} absolute z-10`}
          style={{
            right: 'max(16px, env(safe-area-inset-right))',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          Skip
          <SkipForward className="size-5" aria-hidden="true" />
        </button>
      ) : null}
    </main>
  )
}
