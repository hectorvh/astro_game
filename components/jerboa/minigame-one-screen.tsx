'use client'

import { useState } from 'react'
import { useAudioPrefs } from '@/lib/jerboa/audio-prefs'
import { LEVELS } from '@/lib/jerboa/levels'
import { useSession } from '@/lib/jerboa/session-context'
import { unityPlayerUrl } from '@/lib/jerboa/unity-messages'
import { UnityGameScreen } from './unity-game-screen'

export function MinigameOneScreen() {
  const { currentLevel, currentMode } = useSession()
  const { muted } = useAudioPrefs()
  // Read once: later mute changes are sent with postMessage, so the iframe never reloads.
  const [initialMuted] = useState(muted)
  const levelId = currentLevel ?? 1
  const levelTitle = LEVELS.find((level) => level.id === levelId)?.title ?? 'Astro Bunny Game'
  const title = currentMode === 'practice' ? `${levelTitle} — Practice` : levelTitle
  const src = unityPlayerUrl(levelId, initialMuted, currentMode)
  return <UnityGameScreen src={src} title={title} mode={currentMode} />
}
