'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, LogOut, X } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'
import { recordTrial } from '@/lib/jerboa/data-access'

const VIDEO_SRC = '/videos/1videogame.mp4'
const STILL_SRC = '/images/vlcsnap-2026-08-17-18h12m50s931.png'

const DIRECTIONS = ['left', 'up', 'down', 'right'] as const
type Direction = (typeof DIRECTIONS)[number]
const CORRECT: Direction = 'down'

/** Hit boxes over the painted arrows on the 1280×720 still. */
const ARROW_HITS: Record<Direction, { left: string; top: string; width: string; height: string }> = {
  left: { left: '21.6%', top: '78.6%', width: '12.5%', height: '16.4%' },
  up: { left: '36.4%', top: '78.6%', width: '12.4%', height: '16.4%' },
  down: { left: '51.1%', top: '78.6%', width: '12.5%', height: '16.4%' },
  right: { left: '65.9%', top: '78.6%', width: '12.4%', height: '16.4%' },
}

export function MinigameOneScreen() {
  const { goTo } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const stillShownAt = useRef<number | null>(null)
  const [phase, setPhase] = useState<'video' | 'still'>('video')
  const [needsTap, setNeedsTap] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<null | 'correct' | 'incorrect'>(null)
  const [error, setError] = useState<string | null>(null)

  function showStill() {
    setNeedsTap(false)
    stillShownAt.current = Date.now()
    setPhase('still')
  }

  useEffect(() => {
    if (phase !== 'video') return
    const video = videoRef.current
    if (!video) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showStill()
      return
    }

    let cancelled = false
    const player = video
    player.muted = false
    player.volume = 1
    player.defaultMuted = false

    async function start() {
      try {
        await player.play()
      } catch {
        if (!cancelled) setNeedsTap(true)
      }
    }

    void start()
    return () => {
      cancelled = true
    }
  }, [phase])

  async function playFromTap() {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.volume = 1
    try {
      await video.play()
      setNeedsTap(false)
    } catch {
      showStill()
    }
  }

  async function choose(direction: Direction) {
    if (result || busy) return
    setBusy(true)
    setError(null)
    const isCorrect = direction === CORRECT
    const elapsed = stillShownAt.current
      ? Math.max(0, Date.now() - stillShownAt.current)
      : null

    try {
      await recordTrial({
        minigame: 'watchful_bird',
        spatialCategory: 'projective',
        stimulusId: 'where_is_the_cube',
        response: { direction },
        isCorrect,
        responseTimeMs: elapsed,
      })
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : 'We could not save your answers just now. Please try again.',
      )
    }

    setResult(isCorrect ? 'correct' : 'incorrect')
    setBusy(false)
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background">
      {phase === 'video' ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO_SRC}
            playsInline
            preload="auto"
            disablePictureInPicture
            onEnded={showStill}
            onError={showStill}
            aria-label="The Watchful Bird mini-game"
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
        </>
      ) : (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div
              className="relative"
              style={{
                width: 'min(100%, calc(100dvh * 16 / 9))',
                aspectRatio: '16 / 9',
              }}
            >
              <img
                src={STILL_SRC}
                alt="Where is the cube?"
                className="absolute inset-0 h-full w-full"
              />
              <div role="group" aria-label="Where is the cube?">
                {DIRECTIONS.map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    disabled={busy || result !== null}
                    aria-label={`Answer: ${direction}`}
                    onClick={() => void choose(direction)}
                    className="absolute z-10 cursor-pointer rounded-[22%] bg-transparent disabled:cursor-default"
                    style={ARROW_HITS[direction]}
                  />
                ))}
              </div>
            </div>
          </div>

          {result === null ? (
            <button
              type="button"
              onClick={() => goTo('map')}
              className="absolute right-4 bottom-4 z-10 flex h-14 items-center justify-center gap-2 rounded-2xl bg-destructive px-6 text-xl font-bold text-destructive-foreground shadow-storybook hover:brightness-95 sm:right-6 sm:bottom-6"
            >
              <LogOut className="size-6" />
              Exit
            </button>
          ) : null}

          {result ? (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="trial-result-title"
            >
              <div className="w-full max-w-sm rounded-3xl border-2 border-secondary/40 bg-card p-6 text-center shadow-storybook sm:p-8">
                <span
                  className={
                    'mx-auto mb-4 flex size-16 items-center justify-center rounded-full ' +
                    (result === 'correct'
                      ? 'bg-primary/12 text-primary'
                      : 'bg-destructive/12 text-destructive')
                  }
                >
                  {result === 'correct' ? (
                    <Check className="size-8" />
                  ) : (
                    <X className="size-8" />
                  )}
                </span>
                <h2
                  id="trial-result-title"
                  className="mb-2 font-display text-3xl font-bold text-purple"
                >
                  {result === 'correct' ? 'Correct' : 'Incorrect'}
                </h2>
                {error ? (
                  <p role="alert" className="mb-4 text-base font-semibold text-destructive">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => goTo('map')}
                  className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground hover:bg-teal-dark"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}
