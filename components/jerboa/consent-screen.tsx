'use client'

import { useState } from 'react'
import { ArrowRight, Check, FileCheck2, HeartHandshake, Lock, ShieldCheck } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'
import { Panel } from './scene'

const STATEMENTS = [
  {
    icon: HeartHandshake,
    title: 'Your participation is voluntary',
    body: 'You choose to take part, and there is no penalty for stopping.',
  },
  {
    icon: Lock,
    title: 'Your data is confidential and anonymised',
    body: 'Answers are stored without identifying you personally.',
  },
  {
    icon: ShieldCheck,
    title: 'You can withdraw at any time',
    body: 'You may leave the study whenever you like, no reason needed.',
  },
  {
    icon: FileCheck2,
    title: 'Results are used for research only',
    body: 'Your responses support academic research and nothing else.',
  },
]

export function ConsentScreen() {
  const { error, authStatus, submitConsent } = useSession()
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)

  // A consent decision that cannot be written must not be actionable: both
  // answers are recorded rows, so neither button works without a session.
  const blocked = busy || authStatus !== 'ready'

  async function handleDecision(decision: boolean) {
    setBusy(true)
    await submitConsent(decision)
    setBusy(false)
  }

  return (
    <Panel className="max-w-2xl">
      <div className="mb-6 text-center">
        <p className="mb-1 text-sm font-bold tracking-widest text-purple uppercase">
          Before we begin
        </p>
        <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">
          Ethical Information &amp; Consent
        </h1>
        <p className="mt-2 text-lg text-muted-foreground text-pretty">
          This study is part of a research project about spatial communication.
        </p>
      </div>

      <ul className="mb-6 grid gap-3 sm:grid-cols-2">
        {STATEMENTS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-background/60 p-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent [&_svg]:size-5"
            >
              <Icon />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">{title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Consent gate */}
      <label
        className={
          'flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors ' +
          (agreed ? 'border-primary bg-primary/8' : 'border-input bg-card')
        }
      >
        <span className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="flex size-8 items-center justify-center rounded-lg border-2 border-input bg-background peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30">
            {agreed ? <Check className="size-5 text-primary-foreground" /> : null}
          </span>
        </span>
        <span className="text-lg leading-relaxed text-foreground">
          I have read and understood the information above, and{' '}
          <strong>I agree to participate</strong> in this study.
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border-2 border-destructive/40 bg-destructive/8 p-4 text-base font-semibold text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => handleDecision(false)}
          disabled={blocked}
          aria-disabled={blocked}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-input bg-background px-6 text-lg font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => handleDecision(true)}
          disabled={!agreed || blocked}
          aria-disabled={!agreed || blocked}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-storybook transition-transform hover:bg-teal-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:flex-none sm:px-10"
        >
          I Agree
          <ArrowRight className="size-6" />
        </button>
      </div>
      {!agreed ? (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Please tick the box above to continue to the adventure.
        </p>
      ) : null}
    </Panel>
  )
}
