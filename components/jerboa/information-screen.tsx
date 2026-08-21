'use client'

import { ArrowLeft, ArrowRight, ScrollText } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'
import { Panel } from './scene'

export function InformationScreen() {
  const { goTo } = useSession()

  return (
    <Panel className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl bg-accent/12 text-accent [&_svg]:size-6"
        >
          <ScrollText />
        </span>
        <div>
          <p className="text-sm font-bold tracking-widest text-accent uppercase">
            About the study
          </p>
          <h1 className="font-display text-3xl font-bold text-purple sm:text-4xl">
            Participant Information
          </h1>
        </div>
      </div>

      {/* Placeholder copy — stands in for the formal participant information
          sheet the research team will supply (spec §3, Screen 2). */}
      <div className="space-y-4 rounded-2xl bg-background/60 p-5 text-lg leading-relaxed text-foreground sm:p-6">
        <p>
          Thank you for your interest in <strong>Laika Odyssey: A Spatial Adventure</strong>. This
          study is part of a research project about <strong>spatial communication</strong> — how
          people describe where things are and how they move.
        </p>
        <p>
          During the game you will help Laika, a cartoon dog in a little spacecraft, fly through
          space toward Jupiter. Along the way you will complete a few short, friendly tasks. There
          are no right or wrong answers to worry about, and there is no timer you need to beat.
        </p>
        <p>
          Taking part is completely voluntary, and you can stop at any point. On the next screen
          we will explain how your information is looked after and ask for your consent before you
          begin.
        </p>
        <p className="rounded-xl border-2 border-dashed border-secondary/50 bg-secondary/10 p-4 text-base text-muted-foreground">
          <strong className="text-foreground">Note for the research team:</strong> this is
          placeholder text. Replace it with the approved participant information sheet before any
          real data collection.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => goTo('userdatasetup')}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-input bg-background px-6 text-lg font-bold text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
          Back
        </button>
        <button
          type="button"
          onClick={() => goTo('consent')}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-storybook transition-transform hover:bg-teal-dark active:translate-y-px sm:flex-none sm:px-10"
        >
          Continue
        </button>
      </div>
    </Panel>
  )
}
