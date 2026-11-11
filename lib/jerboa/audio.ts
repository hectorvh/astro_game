interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

let shared: AudioContext | null = null

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (shared) return shared
  const ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext
  if (!ctor) return null
  try {
    shared = new ctor()
    return shared
  } catch {
    return null
  }
}

export function unlockAudio(): void {
  try {
    const ctx = getAudioContext()
    if (!ctx || ctx.state !== 'suspended') return
    void ctx.resume().catch(() => {
      // A later gesture can try again.
    })
  } catch {
    // Audio is optional. The flow must continue without it.
  }
}
