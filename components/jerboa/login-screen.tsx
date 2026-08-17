'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, KeyRound, LogIn, UserRound } from 'lucide-react'
import { credentialsSchema, type Credentials } from '@/lib/jerboa/schema'
import { useSession } from '@/lib/jerboa/session-context'
import { Panel } from './scene'
import { FieldError, FieldLabel, TextInput } from './form-fields'

export function LogInScreen() {
  const { error, authStatus, goTo, submitLogIn } = useSession()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    mode: 'onSubmit',
    defaultValues: { userid: '', password: '' },
  })

  const blocked = isSubmitting || authStatus !== 'ready'

  return (
    <Panel className="max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-purple text-balance sm:text-4xl">
          Welcome back
        </h1>
      </div>

      <form
        onSubmit={handleSubmit((values) => submitLogIn(values))}
        noValidate
        className="flex flex-col gap-5"
      >
        <div>
          <FieldLabel htmlFor="userid" icon={<UserRound />}>
            User ID
          </FieldLabel>
          <TextInput
            id="userid"
            autoComplete="username"
            spellCheck={false}
            aria-invalid={!!errors.userid}
            aria-describedby={errors.userid ? 'userid-error' : undefined}
            {...register('userid')}
          />
          <FieldError id="userid-error" message={errors.userid?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="password" icon={<KeyRound />}>
            Password
          </FieldLabel>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <FieldError id="password-error" message={errors.password?.message} />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border-2 border-destructive/40 bg-destructive/8 p-4 text-base font-semibold text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => goTo('welcome')}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-input bg-background px-6 text-lg font-bold text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={blocked}
            aria-disabled={blocked}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-storybook transition-transform hover:bg-teal-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:flex-none sm:px-10"
          >
            <LogIn className="size-6" />
            Log In
          </button>
        </div>
      </form>
    </Panel>
  )
}
