'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/jerboa/session-context'

const INTRO_SRC = '/videos/generate_a_video_intro_in_one.mp4'

export function IntroScreen() {
  const { goTo } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [needsTap, setNeedsTap] = useState(false)

  function finish() {
    goTo('welcome')
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      goTo('welcome')
      return
    }

    let cancelled = false
    video.muted = false
    video.volume = 1
    video.defaultMuted = false

    async function start() {
      try {
        await video.play()
      } catch {
        if (!cancelled) setNeedsTap(true)
      }
    }

    void start()
    return () => {
      cancelled = true
    }
  }, [goTo])

  async function playFromTap() {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.volume = 1
    try {
      await video.play()
      setNeedsTap(false)
    } catch {
      finish()
    }
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={INTRO_SRC}
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={finish}
        onError={finish}
        aria-label="Laika Odyssey introduction"
      />

      {needsTap ? (
        <button
          type="button"
          onClick={() => void playFromTap()}
          className="relative z-10 flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-xl font-bold text-primary-foreground shadow-storybook hover:bg-teal-dark"
        >
          Play
        </button>
      ) : null}

      <button
        type="button"
        onClick={finish}
        className="absolute right-4 bottom-4 z-10 flex h-14 items-center justify-center rounded-2xl bg-card/90 px-6 text-xl font-bold text-foreground shadow-storybook backdrop-blur-sm hover:bg-muted sm:right-6 sm:bottom-6"
      >
        Skip
      </button>
    </main>
  )
}
