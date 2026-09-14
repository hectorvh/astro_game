'use client'

import { useState } from 'react'
import { ChevronLeft, Flag, Settings, Sparkles } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'

const MAP_BUNNY = '/images/Gemini_Generated_Image_64cq7564cq7564cq-removebg.png'

const START = { x: 10, y: 91 }

const NODES = [
  {
    id: 1,
    label: 'Galaxy Drift',
    x: 20,
    y: 54,
    icon: '/images/map-galaxy-drift.png',
    game: 'minigame1' as const,
  },
  {
    id: 2,
    label: 'Ice Moon',
    x: 40,
    y: 80,
    icon: '/images/map-ice-moon.png',
    game: null,
  },
  {
    id: 3,
    label: 'Crystal Caves',
    x: 52,
    y: 38,
    icon: '/images/map-crystal-caves.png',
    game: null,
  },
  {
    id: 4,
    label: 'Moss World',
    x: 76,
    y: 66,
    icon: '/images/map-moss-world.png',
    game: null,
  },
  { id: 5, label: 'Home Signal', x: 90, y: 30, icon: null, game: null },
]

const PATH_POINTS = [START, ...NODES.map(({ x, y }) => ({ x, y }))]
const PATH_D = smoothPath(PATH_POINTS)

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x} ${p2.y}`
  }
  return d
}

export function MapScreen() {
  const { goTo } = useSession()
  const [active, setActive] = useState<number | null>(null)

  const activeNode = NODES.find((n) => n.id === active)

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-background">
      {/* Starfield backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/istockphoto-2254758785-612x612.jpg')" }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-background/25" />

      <button
        type="button"
        onClick={() => goTo('title')}
        aria-label="Back to title screen"
        className="absolute top-4 left-4 z-20 flex size-12 items-center justify-center rounded-full border-2 border-primary/40 bg-card/90 text-foreground shadow-storybook backdrop-blur-sm transition-colors hover:bg-muted sm:top-6 sm:left-6"
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        type="button"
        onClick={() => goTo('settings')}
        aria-label="Settings — edit your details"
        className="absolute top-4 right-4 z-20 flex size-12 items-center justify-center rounded-full border-2 border-primary/40 bg-card/90 text-foreground shadow-storybook backdrop-blur-sm transition-colors hover:bg-muted sm:top-6 sm:right-6"
      >
        <Settings className="size-6" />
      </button>

      <h1 className="pointer-events-none absolute top-12 left-1/2 z-20 -translate-x-1/2 text-center font-display text-5xl font-bold leading-none text-balance sm:top-14 sm:text-6xl md:top-16 md:text-7xl">
        <span className="block text-purple text-shadow-soft">Astro</span>
        <span className="block text-primary text-shadow-soft">Bunny</span>
      </h1>

      {/* Path + nodes overlay */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={PATH_D}
            fill="none"
            stroke="var(--lane-cyan)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.2 3"
            opacity="0.7"
          />
        </svg>

        {/* Start marker */}
        <Marker x={START.x} y={START.y}>
          <div className="flex flex-col items-center">
            <span className="rounded-full bg-clay px-3 py-1 text-xs font-bold text-hud-text shadow-storybook">
              START
            </span>
          </div>
        </Marker>

        {NODES.map((node) => (
          <Marker key={node.id} x={node.x} y={node.y}>
            <button
              type="button"
              onClick={() =>
                node.game ? goTo(node.game) : setActive(node.id)
              }
              className="pointer-events-auto group flex flex-col items-center gap-1"
              aria-label={`Stop ${node.id}: ${node.label}`}
            >
              {node.icon ? (
                <img
                  src={node.icon}
                  alt=""
                  className="size-16 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-110 sm:size-[4.5rem]"
                />
              ) : (
                <span className="flex size-11 items-center justify-center rounded-full border-4 border-card bg-secondary text-secondary-foreground shadow-storybook transition-transform group-hover:scale-110 sm:size-12">
                  <Flag className="size-5" />
                </span>
              )}
              <span className="rounded-full bg-card/90 px-2 py-0.5 text-xs font-bold text-foreground shadow-sm">
                {node.label}
              </span>
            </button>
          </Marker>
        ))}
      </div>

      {/* Astro Bunny at the start — tap to open 3D view */}
      <div className="pointer-events-none absolute inset-0 z-[21]">
        <Marker x={START.x + 4} y={START.y - 14}>
          <button
            type="button"
            onClick={() => goTo('bunny3d')}
            aria-label="View Astro Bunny in 3D"
            className="pointer-events-auto block cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <img
              src={MAP_BUNNY}
              alt=""
              className="w-28 animate-bob drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] transition-transform hover:scale-105 sm:w-36"
            />
          </button>
        </Marker>
      </div>

      {activeNode ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="node-title"
        >
          <div className="w-full max-w-sm rounded-3xl border-2 border-primary/40 bg-card p-6 text-center shadow-storybook">
            <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary">
              {activeNode.icon ? (
                <img src={activeNode.icon} alt="" className="size-12 object-contain" />
              ) : (
                <Sparkles className="size-7" />
              )}
            </span>
            <p className="text-sm font-bold tracking-widest text-primary uppercase">
              Stop {activeNode.id}
            </p>
            <h2 id="node-title" className="mb-2 font-display text-2xl font-bold text-purple">
              {activeNode.label}
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              This is where a mini-game will live. The tasks are coming soon — for now, the flight
              path is just for exploring.
            </p>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground hover:bg-teal-dark"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function Marker({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  )
}
