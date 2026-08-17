'use client'

import { useState } from 'react'
import { ChevronLeft, Flag, MessageCircle, Settings, Sparkles, Star } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'

// Landmark nodes along the curved desert path (percent coordinates on the
// terrain image). Start = cactus/burrow (lower-left) → goal = oasis (upper-right).
// Each node will host a mini-game (out of scope for the mock, spec §1).
const NODES = [
  { id: 1, label: 'The Watchful Bird', x: 20, y: 62 },
  { id: 2, label: 'Whispering Dunes', x: 40, y: 74 },
  { id: 3, label: 'Crystal Hollow', x: 55, y: 48 },
  { id: 4, label: 'Old Stone Temple', x: 74, y: 60 },
  { id: 5, label: 'The Oasis', x: 84, y: 30 },
]

const PATH_D = 'M 10 84 L 20 62 L 40 74 L 55 48 L 74 60 L 84 30'

export function MapScreen() {
  const { goTo, participant } = useSession()
  const [active, setActive] = useState<number | null>(null)

  const activeNode = NODES.find((n) => n.id === active)

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-background">
      {/* Terrain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/map-terrain.webp')" }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-background/10" />

      {/* Top bar */}
      <div className="relative z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="max-w-md rounded-2xl border-2 border-secondary/40 bg-card/90 p-4 shadow-storybook backdrop-blur-sm">
          <h1 className="font-display text-2xl font-bold text-purple sm:text-3xl">
            Jerboa&apos;s Journey
          </h1>
          <p className="mt-1 text-base leading-snug text-muted-foreground text-pretty">
            Help Jerboa cross the desert! Reach each stop and use your communication skills to
            solve friendly challenges.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => goTo('title')}
            aria-label="Back to title screen"
            className="flex size-12 items-center justify-center rounded-2xl border-2 border-secondary/40 bg-card/90 text-foreground shadow-storybook backdrop-blur-sm transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => goTo('settings')}
            aria-label="Settings — edit your details"
            className="flex size-12 items-center justify-center rounded-2xl border-2 border-secondary/40 bg-card/90 text-foreground shadow-storybook backdrop-blur-sm transition-colors hover:bg-muted"
          >
            <Settings className="size-6" />
          </button>
        </div>
      </div>

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
            stroke="var(--card)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.2 3"
            opacity="0.9"
          />
        </svg>

        {/* Start marker */}
        <Marker x={10} y={84}>
          <div className="flex flex-col items-center">
            <span className="rounded-full bg-clay px-3 py-1 text-xs font-bold text-primary-foreground shadow-storybook">
              START
            </span>
          </div>
        </Marker>

        {NODES.map((node) => (
          <Marker key={node.id} x={node.x} y={node.y}>
            <button
              type="button"
              onClick={() => setActive(node.id)}
              className="pointer-events-auto group flex flex-col items-center gap-1"
              aria-label={`Stop ${node.id}: ${node.label}`}
            >
              <span
                className={
                  'flex size-11 items-center justify-center rounded-full border-4 border-card text-lg font-bold shadow-storybook transition-transform group-hover:scale-110 sm:size-12 ' +
                  (node.id === 5
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground')
                }
              >
                {node.id === 5 ? <Flag className="size-5" /> : node.id}
              </span>
              <span className="rounded-full bg-card/90 px-2 py-0.5 text-xs font-bold text-foreground shadow-sm">
                {node.label}
              </span>
            </button>
          </Marker>
        ))}
      </div>

      {/* Jerboa at the start */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Marker x={10} y={72}>
          <img
            src="/images/jerboa.webp"
            alt="Jerboa waiting at the start of the trail"
            className="jerboa-cutout w-20 animate-bob drop-shadow-[0_12px_12px_rgba(63,47,30,0.3)] sm:w-24"
          />
        </Marker>
      </div>

      {/* Footer hint */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:p-6">
        <div className="flex max-w-md flex-col gap-1 rounded-2xl border-2 border-secondary/40 bg-card/90 px-5 py-3 text-sm shadow-storybook backdrop-blur-sm">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Star className="size-4 text-secondary" />
            Each stop brings a new task.
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="size-4 text-primary" />
            {participant?.name
              ? `Ready when you are, ${participant.name}!`
              : 'Use your communication skills to help Jerboa!'}
          </span>
        </div>
      </div>

      {/* Node detail overlay (mini-games are out of scope for the mock) */}
      {activeNode ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="node-title"
        >
          <div className="w-full max-w-sm rounded-3xl border-2 border-secondary/40 bg-card p-6 text-center shadow-storybook">
            <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Sparkles className="size-7" />
            </span>
            <p className="text-sm font-bold tracking-widest text-primary uppercase">
              Stop {activeNode.id}
            </p>
            <h2 id="node-title" className="mb-2 font-display text-2xl font-bold text-purple">
              {activeNode.label}
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              This is where a mini-game will live. The tasks are coming soon — for now, the trail
              is just for exploring.
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
