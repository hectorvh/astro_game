'use client'

import { HeartHandshake, RotateCcw } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'
import { Panel } from './scene'

/**
 * Terminal state for a declined consent (spec §3, Screen 3). The session is
 * over: there is no route back into the flow and no further data is collected.
 */
export function DeclinedScreen() {
  const { resetSession } = useSession()

  return (
    <Panel className="max-w-xl text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent/12 text-accent [&_svg]:size-8"
      >
        <HeartHandshake />
      </span>

      <p className="mb-1 text-sm font-bold tracking-widest text-accent uppercase">
        Session ended
      </p>
      <h1 className="mb-3 font-display text-3xl font-bold text-purple text-balance sm:text-4xl">
        Thank you for your time
      </h1>

      <div className="space-y-4 text-lg leading-relaxed text-muted-foreground text-pretty">
        <p>
          You chose not to take part, and that is completely fine. No further
          information will be collected, and your answers have not been kept.
        </p>
        <p>
          You can simply close this window now. If you change your mind later, you
          are welcome to start again.
        </p>
      </div>

      <p className="mt-6 rounded-2xl bg-background/60 p-4 text-base text-muted-foreground">
        Questions about the study? Contact the SCALA research team at ifgi,
        University of Münster.
      </p>

      <button
        type="button"
        onClick={resetSession}
        className="mx-auto mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-input bg-background px-6 text-lg font-bold text-foreground transition-colors hover:bg-muted"
      >
        <RotateCcw className="size-5" />
        Start again
      </button>
    </Panel>
  )
}
