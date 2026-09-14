'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSession } from '@/lib/jerboa/session-context'

type UnityGameScreenProps = {
  src: string
  title: string
}

const EXIT_MESSAGE = 'astroBunnyExit'

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
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return
      if (event.data?.type !== EXIT_MESSAGE) return
      goTo('map')
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [goTo])

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
    </main>
  )
}
