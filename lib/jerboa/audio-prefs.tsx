'use client'

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { setAudioMuted } from './audio'

const STORAGE_KEY = 'astrobunny.muted'
const CHANGE = 'astrobunny-muted'

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(muted: boolean): void {
  setAudioMuted(muted)
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Private mode can block storage. The choice still applies for this visit.
  }
  window.dispatchEvent(new Event(CHANGE))
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(CHANGE, onStoreChange)
  window.addEventListener('storage', onStoreChange)
  return () => {
    window.removeEventListener(CHANGE, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

function getMuted(): boolean {
  const muted = readMuted()
  setAudioMuted(muted)
  return muted
}

type AudioPrefs = {
  muted: boolean
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

const AudioPrefsContext = createContext<AudioPrefs | null>(null)

export function AudioPrefsProvider({ children }: { children: ReactNode }) {
  const muted = useSyncExternalStore(subscribe, getMuted, () => false)
  const value = useMemo<AudioPrefs>(
    () => ({
      muted,
      setMuted: (next) => writeMuted(next),
      toggleMuted: () => writeMuted(!readMuted()),
    }),
    [muted],
  )
  return <AudioPrefsContext.Provider value={value}>{children}</AudioPrefsContext.Provider>
}

export function useAudioPrefs(): AudioPrefs {
  const value = useContext(AudioPrefsContext)
  if (!value) throw new Error('useAudioPrefs must be used within AudioPrefsProvider')
  return value
}
