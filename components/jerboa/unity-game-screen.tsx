'use client'

import { useCallback, useEffect, useRef } from 'react'
import { LogOut } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'

type UnityGameScreenProps = {
  src: string
  title: string
}

export function UnityGameScreen({ src, title }: UnityGameScreenProps) {
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
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden overscroll-none bg-[#231F20]"
      onPointerDown={focusGame}
    >
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        tabIndex={0}
        className="absolute inset-0 h-full w-full border-0 [touch-action:none]"
        allow="fullscreen; autoplay; gamepad"
        allowFullScreen
        onLoad={focusGame}
      />
      <button
        type="button"
        onClick={() => goTo('map')}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Exit"
        className="absolute right-4 bottom-28 z-10 flex size-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-storybook hover:brightness-95 sm:right-6 sm:bottom-32"
      >
        <LogOut className="size-5" />
      </button>
    </main>
  )
}
