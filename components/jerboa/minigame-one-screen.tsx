'use client'

import { useCallback, useEffect, useRef } from 'react'
import { LogOut } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'

const GAME_SRC = '/game-build/play.html'

export function MinigameOneScreen() {
  const { goTo } = useSession()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const focusGame = useCallback(() => {
    const frame = iframeRef.current
    if (!frame) return
    frame.focus()
    try {
      frame.contentWindow?.focus()
      frame.contentDocument?.getElementById('unity-canvas')?.focus()
    } catch {
      // iframe may not be ready yet
    }
  }, [])

  useEffect(() => {
    const frame = iframeRef.current
    if (!frame) return

    function onLoad() {
      focusGame()
    }

    frame.addEventListener('load', onLoad)
    const timers = [300, 1200, 3000, 7000].map((ms) => window.setTimeout(focusGame, ms))

    return () => {
      frame.removeEventListener('load', onLoad)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [focusGame])

  return (
    <main
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#231F20]"
      onPointerDown={focusGame}
    >
      <iframe
        ref={iframeRef}
        src={GAME_SRC}
        title="Jupiter Run"
        tabIndex={0}
        className="absolute inset-0 h-full w-full border-0"
        allow="fullscreen; autoplay; gamepad"
        allowFullScreen
        onLoad={focusGame}
      />
      <button
        type="button"
        onClick={() => goTo('map')}
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute right-4 bottom-4 z-10 flex h-14 items-center justify-center gap-2 rounded-2xl bg-destructive px-6 text-xl font-bold text-destructive-foreground shadow-storybook hover:brightness-95 sm:right-6 sm:bottom-6"
      >
        <LogOut className="size-6" />
        Exit
      </button>
    </main>
  )
}
