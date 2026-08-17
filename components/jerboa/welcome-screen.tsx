'use client'

import { ArrowRight, Languages, LogIn, UserPlus } from 'lucide-react'
import { UI_LANGUAGES } from '@/lib/jerboa/constants'
import { useSession } from '@/lib/jerboa/session-context'
import { Panel } from './scene'
import { FieldLabel, NativeSelect } from './form-fields'

export function WelcomeScreen() {
  const { startLogIn, startSignIn, draft, authStatus, error, patchDraft } = useSession()
  const uiLanguage = draft?.uiLanguage ?? 'en'
  const blocked = authStatus !== 'ready'

  function chooseLanguage(value: string) {
    patchDraft({ uiLanguage: value })
  }

  return (
    <Panel className="max-w-lg text-center">
      <p className="mb-2 text-sm font-bold tracking-widest text-primary uppercase">
        Welcome
      </p>
      <h1 className="mb-8 font-display text-4xl font-bold text-purple text-balance sm:text-5xl">
        {"Jerboa's Journey"}
      </h1>

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-2xl border-2 border-destructive/40 bg-destructive/8 p-4 text-base font-semibold text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mx-auto mb-8 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          disabled={blocked}
          aria-disabled={blocked}
          onClick={() => void startLogIn()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-input bg-background px-6 text-xl font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="size-6" />
          Log In
        </button>
        <button
          type="button"
          disabled={blocked}
          aria-disabled={blocked}
          onClick={() => void startSignIn()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-storybook transition-transform hover:bg-teal-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          <UserPlus className="size-6" />
          Sign In
          <ArrowRight className="size-6" />
        </button>
      </div>

      <div className="mx-auto max-w-sm text-left">
        <FieldLabel htmlFor="ui-language" icon={<Languages />}>
          Language
        </FieldLabel>
        <NativeSelect
          id="ui-language"
          value={uiLanguage}
          onChange={(event) => chooseLanguage(event.target.value)}
        >
          {UI_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value} disabled={!lang.enabled}>
              {lang.label}
              {lang.enabled ? '' : ' — coming soon'}
            </option>
          ))}
        </NativeSelect>
      </div>
    </Panel>
  )
}
