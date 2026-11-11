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

let audioMuted = false

export function setAudioMuted(muted: boolean): void {
  audioMuted = muted
}

// Portfolio latch click. Square oscillator plus a short noise burst on a strong detent.
export function playLatch(strong: boolean): void {
  if (audioMuted) return
  try {
    const actx = getAudioContext()
    if (!actx) return
    if (actx.state === 'suspended') {
      void actx.resume().catch(() => {
        // The click is skipped if the context never starts.
      })
    }
    const t = actx.currentTime
    const osc = actx.createOscillator()
    const gain = actx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(strong ? 1900 : 1400, t)
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.05)
    gain.gain.setValueAtTime(strong ? 0.06 : 0.035, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    osc.connect(gain).connect(actx.destination)
    osc.start(t)
    osc.stop(t + 0.08)
    if (strong) {
      const frames = Math.max(1, Math.floor(actx.sampleRate * 0.04))
      const buffer = actx.createBuffer(1, frames, actx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
      }
      const noise = actx.createBufferSource()
      const noiseGain = actx.createGain()
      noiseGain.gain.value = 0.05
      noise.buffer = buffer
      noise.connect(noiseGain).connect(actx.destination)
      noise.start(t)
    }
  } catch {
    // Audio is optional.
  }
}
