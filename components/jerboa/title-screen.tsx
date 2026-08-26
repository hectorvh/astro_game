'use client'

import { useState } from 'react'
import { LogOut, Play, Settings, X } from 'lucide-react'
import { BRAND } from '@/lib/jerboa/constants'
import { useSession } from '@/lib/jerboa/session-context'
import { DecorGlyphs } from './scene'

const CORNER_BTN =
  'flex size-12 items-center justify-center rounded-full border-2 border-primary/40 bg-card/90 text-foreground shadow-storybook backdrop-blur-sm transition-colors hover:bg-muted'

const ACTION_BTN =
  'flex h-12 w-52 items-center justify-center gap-2 rounded-full text-base font-bold shadow-storybook transition-transform hover:-translate-y-0.5 active:translate-y-0'

export function TitleScreen() {
  const { resetSession, goTo } = useSession()
  const [overlay, setOverlay] = useState<null | 'about' | 'exit'>(null)

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

      <button
        type="button"
        onClick={() => setOverlay('about')}
        aria-label="About the Experiment"
        className={`absolute top-4 left-4 z-20 sm:top-6 sm:left-6 ${CORNER_BTN}`}
      >
        <span className="font-serif text-[1.45rem] font-bold italic leading-none" aria-hidden>
          i
        </span>
      </button>
      <button
        type="button"
        onClick={() => goTo('settings')}
        aria-label="Settings"
        className={`absolute top-4 right-4 z-20 sm:top-6 sm:right-6 ${CORNER_BTN}`}
      >
        <Settings className="size-6" />
      </button>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 pt-20 pb-10 md:flex-row md:justify-between md:gap-6 md:pt-10">
        {/* Character */}
        <div className="relative flex w-full max-w-xs items-end justify-center md:order-2 md:max-w-sm">
          {/* Ground contact shadow so the character reads as standing, not floating */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-1/2 h-4 w-24 -translate-x-1/2 rounded-[50%] bg-foreground/25 blur-md md:w-28"
          />
          <img
            src={BRAND.characterImage}
            alt="Astro Bunny, a grey-and-white rabbit astronaut in a white and blue spacesuit"
            className="relative w-48 md:w-64"
          />
        </div>

        {/* Title + menu */}
        <div className="flex w-full max-w-md flex-col items-center text-center md:order-1 md:items-start md:text-left">
          <h1 className="font-display text-6xl font-bold leading-none text-balance sm:text-7xl">
            <span className="block text-purple text-shadow-soft">Astro</span>
            <span className="block text-primary text-shadow-soft">Bunny</span>
          </h1>
          <p className="mt-3 mb-8 rounded-full bg-card/80 px-4 py-1.5 text-base font-semibold text-muted-foreground shadow-sm">
            Galaxy Drift
          </p>

          <nav className="flex flex-col items-center gap-3 md:items-start" aria-label="Main menu">
            <button
              type="button"
              onClick={() => goTo('map')}
              className={`${ACTION_BTN} bg-primary text-primary-foreground hover:bg-teal-dark`}
            >
              <Play className="size-5" />
              Start Playing
            </button>
            <button
              type="button"
              onClick={() => setOverlay('exit')}
              className={`${ACTION_BTN} bg-destructive text-destructive-foreground hover:brightness-95`}
            >
              <LogOut className="size-5" />
              Exit
            </button>
          </nav>
        </div>
      </div>

      {overlay ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
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
                {BRAND.fullTitle} is a research instrument from the SCALA project
                (Spatial Communication and Ageing across Languages). By playing, you help
                researchers learn how people from different languages and cultures describe space.
                Your data is anonymised and used for research only.
              </p>
            ) : (
              <div>
                <p className="mb-6 text-lg leading-relaxed text-foreground">
                  Thank you for helping Astro Bunny! You can return to the start at any time.
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
