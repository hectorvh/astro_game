'use client'

import { Component, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Info, Settings, Volume2, VolumeX } from 'lucide-react'
import { BRAND } from '@/lib/jerboa/constants'
import { getLevelStatus, LEVELS, type LevelDef } from '@/lib/jerboa/levels'

const LOGOS = [
  { src: '/images/brand/SCALA_logo.png', alt: 'SCALA' },
  { src: '/images/brand/EU_co_logo.png', alt: 'Co-funded by the European Union' },
  { src: '/images/brand/UKRI_logo.png', alt: 'UK Research and Innovation' },
]

export function SelectionTag({
  level,
  shaking,
  onLaunch,
}: {
  level: LevelDef
  shaking: boolean
  onLaunch: () => void
}) {
  const status = getLevelStatus(level.id)
  const label = status.unlocked
    ? `Launch level ${level.code}, ${level.title}`
    : `Level ${level.code}, ${level.title}, locked`
  return (
    <div className={shaking ? 'menu-tag menu-shake' : 'menu-tag'}>
      <button type="button" className="menu-tag-btn hud-focus" aria-label={label} onClick={onLaunch}>
        <span className="menu-tag-copy">
          <span className="menu-tag-k">Current selection:</span>
          <span className="menu-tag-v">{`${level.code} // ${level.key}`}</span>
          <span className="menu-tag-sub">
            {level.character} · {level.spatialFocus}
          </span>
          <span
            className="menu-tag-action"
            style={{ color: status.unlocked ? 'var(--hud-amber)' : 'var(--hud-mute)' }}
          >
            {status.unlocked ? '▸ Launch mission' : 'Locked — coming soon'}
          </span>
        </span>
        <span className="menu-num" aria-hidden="true">
          {level.code}
        </span>
      </button>
    </div>
  )
}

export function MenuLinks({
  muted,
  infoRef,
  onInfo,
  onSettings,
  onMute,
}: {
  muted: boolean
  infoRef: RefObject<HTMLButtonElement | null>
  onInfo: () => void
  onSettings: () => void
  onMute: () => void
}) {
  return (
    <div className="menu-links">
      <button
        ref={infoRef}
        type="button"
        className="hud-icon-btn hud-focus"
        data-tip="About the experiment"
        aria-label="About the experiment"
        onClick={onInfo}
      >
        <Info aria-hidden="true" />
      </button>
      <button
        type="button"
        className="hud-icon-btn hud-focus"
        data-tip="Settings"
        aria-label="Settings"
        onClick={onSettings}
      >
        <Settings aria-hidden="true" />
      </button>
      <button
        type="button"
        className="hud-icon-btn hud-focus"
        data-tip={muted ? 'Unmute' : 'Mute'}
        aria-pressed={muted}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        onClick={onMute}
      >
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      </button>
    </div>
  )
}

export function MenuPrompts({ mode }: { mode: 'auto' | 'touch' | 'kb' | 'pad' }) {
  return (
    <div className={mode === 'auto' ? 'menu-prompts' : `menu-prompts is-${mode}`} aria-hidden="true">
      <span className="prompt-touch">Swipe to cycle · Tap to launch</span>
      <span className="prompt-kb prompt-row">
        <span className="prompt-row is-lead">
          <span className="hud-key">←</span>
          <span className="hud-key">→</span>
          cycle
        </span>
        <span className="prompt-row">
          <span className="hud-key">Enter</span>
          launch
        </span>
      </span>
      <span className="prompt-pad prompt-row">
        <span className="prompt-row">
          <span className="hud-key">L1</span>
          prev
        </span>
        <span className="prompt-row">
          <span className="hud-key">R1</span>
          next
        </span>
        <span className="prompt-row">
          <span className="hud-key">A</span>
          launch
        </span>
      </span>
    </div>
  )
}

export function ScreenReaderLevels({ onChoose }: { onChoose: (index: number) => void }) {
  return (
    <div className="menu-sr">
      {LEVELS.map((level, index) => {
        const status = getLevelStatus(level.id)
        const label = status.unlocked
          ? `Launch level ${level.code}, ${level.title}`
          : `Level ${level.code}, ${level.title}, locked`
        return (
          <button
            key={level.id}
            type="button"
            className="hud-focus"
            aria-label={label}
            onClick={() => onChoose(index)}
          >
            {level.code} {level.title}
          </button>
        )
      })}
    </div>
  )
}

export function LevelCards({ onChoose }: { onChoose: (index: number) => void }) {
  return (
    <div className="absolute inset-0 z-[1] overflow-auto px-4 pt-20 pb-40">
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3">
        {LEVELS.map((level, index) => {
          const status = getLevelStatus(level.id)
          const label = status.unlocked
            ? `Launch level ${level.code}, ${level.title}`
            : `Level ${level.code}, ${level.title}, locked`
          return (
            <button
              key={level.id}
              type="button"
              className="hud-card hud-focus text-left"
              aria-label={label}
              onClick={() => onChoose(index)}
            >
              <span className="hud-eyebrow">{level.code}</span>
              <span className="mt-1 block font-hud-display text-xl text-hud-ink">{level.title}</span>
              <span className="mt-2 block text-base leading-snug text-hud-ink">{level.character}</span>
              <span className="mt-1 block text-base leading-snug text-hud-mute">{level.spatialFocus}</span>
              <span
                className="mt-3 block font-hud-mono text-[13px] tracking-[0.12em] uppercase"
                style={{ color: status.unlocked ? 'var(--hud-amber)' : 'var(--hud-mute)' }}
              >
                {status.unlocked ? '▸ Launch mission' : 'Locked — coming soon'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function focusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')].filter(
    (el) => !el.hasAttribute('disabled'),
  )
}

export function InfoPanel({
  onClose,
  returnFocus,
}: {
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const panel = panelRef.current
    const restore = returnFocus.current
    titleRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = focusable(panel)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restore?.focus()
    }
  }, [returnFocus])

  return (
    <>
      <div className="absolute inset-0 z-[7] bg-black/45" aria-hidden="true" />
      <div
        ref={panelRef}
        className="menu-dossier"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
      >
        <span className="pointer-events-none absolute -top-px -left-px size-2 border-t border-l border-hud-cyan" />
        <span className="pointer-events-none absolute -right-px -bottom-px size-2 border-r border-b border-hud-cyan" />
        <header className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <p className="font-hud-mono text-[12px] tracking-[0.08em] text-hud-mute uppercase">
              /scala/about_the_experiment.dat
            </p>
            <h2
              id="about-title"
              ref={titleRef}
              tabIndex={-1}
              className="mt-1 font-hud-display text-2xl font-semibold text-hud-ink outline-none"
            >
              About the experiment
            </h2>
          </div>
          <button type="button" className="hud-focus min-h-11 shrink-0 px-3 font-hud-mono text-[12px] tracking-[0.08em] text-hud-ink uppercase" onClick={onClose}>
            Close ✕
          </button>
        </header>
        <div className="menu-dossier-body">
          <p>
            {BRAND.fullTitle} is a research instrument from the SCALA project (Spatial Communication
            and Ageing across Languages). By playing, you help researchers learn how people from
            different languages and cultures describe space. Your data is anonymised and used for
            research only.
          </p>
          <p className="mt-3">
            Participation is voluntary. You can stop at any time, and you do not have to answer
            anything you would rather skip.
          </p>
          <div className="mt-5 flex items-center justify-center gap-4 rounded-2xl bg-white px-4 py-3">
            {LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element -- static brand logo, images.unoptimized
              <img key={logo.src} src={logo.src} alt={logo.alt} className="h-10 w-auto object-contain" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function MenuLive({ message }: { message: string }) {
  return (
    <div className="sr-only" aria-live="polite">
      {message}
    </div>
  )
}

export function DialBoundary({
  children,
  fallback,
  onReset,
}: {
  children: ReactNode
  fallback: ReactNode
  onReset?: () => void
}) {
  return (
    <Boundary fallback={fallback} onReset={onReset}>
      {children}
    </Boundary>
  )
}

class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode; onReset?: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  private resetTimer = 0

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error('Level dial failed', error)
    window.clearTimeout(this.resetTimer)
    this.resetTimer = window.setTimeout(() => {
      this.props.onReset?.()
      this.setState({ failed: false })
    }, 250)
  }

  componentWillUnmount() {
    window.clearTimeout(this.resetTimer)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
