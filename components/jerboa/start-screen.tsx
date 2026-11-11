'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Play } from 'lucide-react'
import { unlockAudio } from '@/lib/jerboa/audio'
import { enterFullscreen, isIOSPhoneBrowser } from '@/lib/jerboa/fullscreen'
import { useSession } from '@/lib/jerboa/session-context'
import { SPLASH_LOGO_SRCS } from './splash-screen'

function subscribeIosHint() {
  return () => {}
}

function readIosHint() {
  return isIOSPhoneBrowser()
}

function serverIosHint() {
  return false
}

export function StartScreen() {
  const { goTo } = useSession()
  const started = useRef(false)
  const [disabled, setDisabled] = useState(false)
  const showIosHint = useSyncExternalStore(subscribeIosHint, readIosHint, serverIosHint)

  useEffect(() => {
    for (const src of SPLASH_LOGO_SRCS) {
      const image = new Image()
      image.src = src
    }
  }, [])

  function onPlay() {
    if (started.current) return
    started.current = true
    setDisabled(true)
    unlockAudio()
    void enterFullscreen().finally(() => goTo('splash-scala'))
  }

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-[#0A0E14] bg-cover bg-center px-6"
      style={{ backgroundImage: "url('/images/Gemini_Generated_Image_gjhy10gjhy10gjhy.jpeg')" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-background/35" />
      <button
        type="button"
        onClick={onPlay}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label="Play — opens the game in full screen"
        className="relative z-10 inline-flex min-h-[64px] min-w-[240px] items-center justify-center gap-3 rounded-full bg-[#00E5FF] px-8 text-[24px] font-bold text-[#0A0E14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#FF9100] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Play className="size-7" aria-hidden="true" />
        Play
      </button>
      {showIosHint ? (
        <p className="relative z-10 mt-6 max-w-sm text-center text-base text-[#8296AB]">
          Tip: for full screen on iPhone, tap Share → Add to Home Screen.
        </p>
      ) : null}
    </main>
  )
}
