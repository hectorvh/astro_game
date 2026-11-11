'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { playLatch, unlockAudio } from '@/lib/jerboa/audio'
import { useAudioPrefs } from '@/lib/jerboa/audio-prefs'
import { enterFullscreen } from '@/lib/jerboa/fullscreen'
import { getLevelStatus, LEVELS } from '@/lib/jerboa/levels'
import { useSession } from '@/lib/jerboa/session-context'
import { createDial, mod, type MenuBridge } from './menu/dial-geometry'
import { LevelDial } from './menu/level-dial'
import {
  DialBoundary,
  InfoPanel,
  LevelCards,
  MenuLinks,
  MenuLive,
  MenuPrompts,
  ScreenReaderLevels,
  SelectionTag,
} from './menu/menu-chrome'
import { StarField } from './menu/star-field'
import './menu/menu.css'

type InputMode = 'auto' | 'touch' | 'kb' | 'pad'

let inputMode: InputMode = 'auto'
const modeListeners = new Set<() => void>()

function setInputMode(mode: InputMode) {
  if (inputMode === mode) return
  inputMode = mode
  modeListeners.forEach((listener) => listener())
}

function useInputMode(): InputMode {
  return useSyncExternalStore(
    (listener) => {
      modeListeners.add(listener)
      return () => modeListeners.delete(listener)
    },
    () => inputMode,
    () => 'auto',
  )
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      query.addEventListener('change', listener)
      return () => query.removeEventListener('change', listener)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function useWebGL(): boolean {
  return useSyncExternalStore(
    () => () => {},
    webglAvailable,
    () => true,
  )
}

function selectedText(index: number): string {
  const level = LEVELS[index]
  const status = getLevelStatus(level.id)
  return `Level ${level.code}, ${level.title}, selected${status.unlocked ? '' : ', locked'}`
}

export function MenuScreen() {
  const { goTo } = useSession()
  const { muted, toggleMuted } = useAudioPrefs()
  const reduce = useReducedMotion()
  const webgl = useWebGL()
  const mode = useInputMode()
  const [index, setIndex] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [live, setLive] = useState('')
  const dialRef = useRef(createDial())
  const indexRef = useRef(0)
  const infoRef = useRef<HTMLButtonElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const infoOpenRef = useRef(false)
  const reduceRef = useRef(reduce)

  const bridgeRef = useRef<MenuBridge>({
    overlay: false,
    reduce: false,
    launch: () => {},
    goTo: () => {},
    preview: () => {},
    release: () => {},
    setInput: () => {},
    poke: () => {},
  })

  const announce = (message: string) => {
    setLive('')
    window.setTimeout(() => setLive(message), 30)
  }

  const poke = () => bridgeRef.current.poke()

  const commit = (dest: number, sound: 'strong' | 'none') => {
    const dial = dialRef.current
    dial.target = dest
    dial.sel = dest
    if (reduceRef.current) {
      dial.pos = dest
      dial.vel = 0
    }
    poke()
    const next = mod(dest, LEVELS.length)
    if (next === indexRef.current) return
    indexRef.current = next
    setIndex(next)
    if (sound === 'strong') playLatch(true)
    announce(selectedText(next))
  }

  const preview = (rounded: number) => {
    const next = mod(rounded, LEVELS.length)
    if (next === indexRef.current) return
    indexRef.current = next
    setIndex(next)
    playLatch(false)
    announce(selectedText(next))
    poke()
  }

  const release = (dest: number, vel: number) => {
    dialRef.current.vel = vel
    const next = mod(dest, LEVELS.length)
    commit(dest, next === indexRef.current ? 'none' : 'strong')
  }

  const goToLevel = (target: number) => {
    const current = mod(Math.round(dialRef.current.target), LEVELS.length)
    let delta = mod(target - current, LEVELS.length)
    if (delta > LEVELS.length / 2) delta -= LEVELS.length
    if (delta === 0) return
    commit(Math.round(dialRef.current.target) + delta, 'strong')
  }

  const step = (dir: number) => {
    commit(Math.round(dialRef.current.target) + dir, 'strong')
  }

  const shake = () => {
    if (reduceRef.current) return
    setShaking(true)
    window.setTimeout(() => setShaking(false), 420)
  }

  const goToRef = useRef(goTo)
  const handlers = useRef<{
    step: (dir: number) => void
    launch: () => void
    goToLevel: (index: number) => void
  }>({
    step: () => {},
    launch: () => {},
    goToLevel: () => {},
  })

  const launch = () => {
    const level = LEVELS[indexRef.current]
    if (!getLevelStatus(level.id).unlocked) {
      playLatch(false)
      shake()
      announce(`Level ${level.code} is not available yet`)
      return
    }
    enterFullscreen()
    unlockAudio()
    goToRef.current('minigame1')
  }

  const choose = (target: number) => {
    const level = LEVELS[target]
    const unlocked = getLevelStatus(level.id).unlocked
    goToLevel(target)
    if (!unlocked) {
      playLatch(false)
      shake()
      announce(`Level ${level.code} is not available yet`)
      return
    }
    enterFullscreen()
    unlockAudio()
    goToRef.current('minigame1')
  }

  useEffect(() => {
    indexRef.current = index
    infoOpenRef.current = infoOpen
    reduceRef.current = reduce
    goToRef.current = goTo
    const bridge = bridgeRef.current
    bridge.overlay = infoOpen
    bridge.reduce = reduce
    bridge.launch = launch
    bridge.goTo = goToLevel
    bridge.preview = preview
    bridge.release = release
    bridge.setInput = (next) => setInputMode(next)
    handlers.current = { step, launch, goToLevel }
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (infoOpenRef.current) return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        setInputMode('kb')
        handlers.current.step(-1)
        event.preventDefault()
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        setInputMode('kb')
        handlers.current.step(1)
        event.preventDefault()
      } else if (key === 'Home') {
        setInputMode('kb')
        handlers.current.goToLevel(0)
        event.preventDefault()
      } else if (key === 'End') {
        setInputMode('kb')
        handlers.current.goToLevel(LEVELS.length - 1)
        event.preventDefault()
      } else if (key === 'Enter' || key === ' ') {
        if (target instanceof HTMLButtonElement) return
        setInputMode('kb')
        handlers.current.launch()
        event.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    let acc = 0
    let idle = 0
    const onWheel = (event: WheelEvent) => {
      if (infoOpenRef.current) return
      event.preventDefault()
      setInputMode('kb')
      const delta =
        (event.deltaMode === 1 ? event.deltaY * 30 : event.deltaMode === 2 ? event.deltaY * shell.clientHeight : event.deltaY) +
        (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0)
      acc += delta
      window.clearTimeout(idle)
      idle = window.setTimeout(() => {
        acc = 0
      }, 320)
      if (Math.abs(acc) >= 60) {
        const dir = Math.sign(acc)
        acc -= dir * 60
        handlers.current.step(dir)
      }
    }
    shell.addEventListener('wheel', onWheel, { passive: false })
    return () => shell.removeEventListener('wheel', onWheel)
  }, [handlers])

  useEffect(() => {
    let frame = 0
    const held = new Map<string, boolean>()
    const tick = () => {
      frame = window.requestAnimationFrame(tick)
      if (infoOpenRef.current || !navigator.getGamepads) return
      for (const pad of navigator.getGamepads()) {
        if (!pad) continue
        const edge = (button: number, run: () => void) => {
          const down = !!pad.buttons[button]?.pressed
          const key = `${pad.index}:${button}`
          if (down && !held.get(key)) {
            setInputMode('pad')
            run()
          }
          held.set(key, down)
        }
        edge(4, () => handlers.current.step(-1))
        edge(5, () => handlers.current.step(1))
        edge(0, () => handlers.current.launch())
      }
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [handlers])

  const level = LEVELS[index]
  const showDial = webgl
  const frameloop = infoOpen ? 'never' : reduce ? 'demand' : 'always'

  return (
    <main className="hud-stage relative min-h-dvh w-full" aria-label="Level menu">
      <h1 className="sr-only">Choose a level</h1>
      <MenuLive message={live} />
      <div ref={shellRef} className="absolute inset-0" inert={infoOpen ? true : undefined}>
        <StarField />
        {showDial ? (
          <DialBoundary fallback={<LevelCards onChoose={choose} />}>
            <LevelDial
              dialRef={dialRef}
              bridgeRef={bridgeRef}
              level={level}
              reduce={reduce}
              frameloop={frameloop}
            />
          </DialBoundary>
        ) : (
          <LevelCards onChoose={choose} />
        )}
        <ScreenReaderLevels onChoose={choose} />
        <SelectionTag level={level} shaking={shaking} onLaunch={launch} />
        <MenuLinks
          muted={muted}
          infoRef={infoRef}
          onInfo={() => {
            infoOpenRef.current = true
            setInfoOpen(true)
          }}
          onSettings={() => goTo('settings')}
          onMute={() => {
            if (!muted) playLatch(true)
            toggleMuted()
            if (muted) playLatch(true)
          }}
        />
        <MenuPrompts mode={mode} />
      </div>
      {infoOpen ? (
        <InfoPanel
          onClose={() => {
            infoOpenRef.current = false
            setInfoOpen(false)
          }}
          returnFocus={infoRef}
        />
      ) : null}
    </main>
  )
}
