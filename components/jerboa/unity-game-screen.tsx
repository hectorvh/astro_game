'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAudioPrefs } from '@/lib/jerboa/audio-prefs'
import { useSession } from '@/lib/jerboa/session-context'
import { parseUnityMessage, type ShellToUnity, type UnityToShell } from '@/lib/jerboa/unity-messages'

type UnityGameScreenProps = {
  src: string
  title: string
}

type AstroBunnyDev = { completeLevel: (level?: number) => void }

declare global {
  interface Window {
    /** Development only: simulates messages from Unity. */
    __astroBunnyDev?: AstroBunnyDev
  }
}

export function UnityGameScreen({ src, title }: UnityGameScreenProps) {
  const { goTo, markLevelCompleted } = useSession()
  const { muted } = useAudioPrefs()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const mutedRef = useRef(muted)
  const sentMutedRef = useRef(muted)
  // Only the first levelComplete / exit per mount navigates.
  const finishedRef = useRef(false)
  const handleRef = useRef<(message: UnityToShell) => void>(() => {})

  const postToUnity = useCallback((message: ShellToUnity) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(message, window.location.origin)
    } catch {
      // The frame may be navigating; the next change or 'ready' resends.
    }
  }, [])

  useEffect(() => {
    mutedRef.current = muted
    if (sentMutedRef.current === muted) return
    sentMutedRef.current = muted
    postToUnity({ type: 'setMuted', muted })
  }, [muted, postToUnity])

  useEffect(() => {
    handleRef.current = (message) => {
      if (message.type === 'ready') {
        // A mute toggled while Unity was loading never reached it; resend the current state.
        sentMutedRef.current = mutedRef.current
        postToUnity({ type: 'setMuted', muted: mutedRef.current })
        return
      }
      if (finishedRef.current) return
      finishedRef.current = true
      if (message.type === 'levelComplete') {
        markLevelCompleted(message.level)
        goTo(message.level === 1 ? 'outro' : 'menu')
        return
      }
      goTo('menu')
    }
  })

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
      if (event.origin !== window.location.origin) return
      const message = parseUnityMessage(event.data)
      if (message) handleRef.current(message)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    window.__astroBunnyDev = {
      completeLevel: (level = 1) => handleRef.current({ type: 'levelComplete', level }),
    }
    return () => {
      delete window.__astroBunnyDev
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
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden overscroll-none bg-[#0c1220]"
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
