'use client'

import { useState } from 'react'
import { Info, LogOut, Play, Settings, X } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'
import { DecorGlyphs } from './scene'

export function TitleScreen() {
  const { resetSession, goTo } = useSession()
  const [overlay, setOverlay] = useState<null | 'about' | 'exit'>(null)

  const menu = [
    {
      label: 'Start Playing',
      icon: Play,
      onClick: () => goTo('map'),
      className: 'bg-primary text-primary-foreground hover:bg-teal-dark',
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => goTo('settings'),
      className: 'bg-secondary text-secondary-foreground hover:bg-amber-dark',
    },
    {
      label: 'About the Experiment',
      icon: Info,
      onClick: () => setOverlay('about'),
      className: 'bg-accent text-accent-foreground hover:bg-purple-dark',
    },
    {
      label: 'Exit',
      icon: LogOut,
      onClick: () => setOverlay('exit'),
      className: 'bg-destructive text-destructive-foreground hover:brightness-95',
    },
  ]

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden">
      {/* Layered parallax space backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/Gemini_Generated_Image_gjhy10gjhy10gjhy.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-background/50"
      />
      <DecorGlyphs />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-10 md:flex-row md:justify-between md:gap-6">
        {/* Character */}
        <div className="relative flex w-full max-w-xs items-end justify-center md:order-2 md:max-w-sm">
          {/* Ground contact shadow so the character reads as standing, not floating */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-1/2 h-4 w-24 -translate-x-1/2 rounded-[50%] bg-foreground/25 blur-md md:w-28"
          />
          <img
            src="/images/Astro_CorgiPilot1-removebg-preview.png"
            alt="Laika, a cartoon dog wearing goggles and piloting a small green flying saucer"
            className="relative w-36 md:w-44"
          />
        </div>

        {/* Title + menu */}
        <div className="flex w-full max-w-md flex-col items-center text-center md:order-1 md:items-start md:text-left">
          <h1 className="font-display text-6xl font-bold leading-none text-balance sm:text-7xl">
            <span className="block text-purple text-shadow-soft">Laika</span>
            <span className="block text-primary text-shadow-soft">Odyssey</span>
          </h1>
          <p className="mt-3 mb-8 rounded-full bg-card/80 px-4 py-1.5 text-base font-semibold text-muted-foreground shadow-sm">
            a spatial adventure
          </p>

          <nav className="flex w-full flex-col gap-3" aria-label="Main menu">
            {menu.map(({ label, icon: Icon, onClick, className }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`flex h-14 w-full items-center gap-3 rounded-2xl px-6 text-xl font-bold shadow-storybook transition-transform hover:-translate-y-0.5 active:translate-y-0 ${className}`}
              >
                <Icon className="size-6" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {overlay ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="overlay-title"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-storybook sm:p-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="overlay-title" className="font-display text-2xl font-bold text-purple">
                {overlay === 'about' ? 'About the Experiment' : 'Leave the adventure?'}
              </h2>
              <button
                type="button"
                onClick={() => setOverlay(null)}
                aria-label="Close"
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            {overlay === 'about' ? (
              <p className="text-lg leading-relaxed text-foreground">
                Laika Odyssey: A Spatial Adventure is a research instrument from the SCALA project
                (Spatial Communication and Ageing across Languages). By playing, you help
                researchers learn how people from different languages and cultures describe space.
                Your data is anonymised and used for research only.
              </p>
            ) : (
              <div>
                <p className="mb-6 text-lg leading-relaxed text-foreground">
                  Thank you for helping Laika! You can return to the start at any time.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOverlay(null)
                    resetSession()
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground hover:bg-teal-dark"
                >
                  Back to the start
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
