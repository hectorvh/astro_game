'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Globe,
  Languages,
  User,
  Users,
} from 'lucide-react'
import { onboardingSchema, type OnboardingValues } from '@/lib/jerboa/schema'
import type { ParticipantRecord } from '@/lib/jerboa/types'
import {
  AGE_RANGES,
  COUNTRY_OPTIONS,
  GENDER_OPTIONS,
} from '@/lib/jerboa/constants'
import { useSession } from '@/lib/jerboa/session-context'
import { Panel } from './scene'
import { FieldError, FieldLabel, NativeSelect, TextInput } from './form-fields'
import { LanguagePicker } from './language-picker'

function profileFromParticipant(p: ParticipantRecord): OnboardingValues {
  return {
    name: p.name,
    ageRange: p.ageRange as OnboardingValues['ageRange'],
    gender: p.gender,
    genderOther: p.genderOther,
    country: p.country,
    uiLanguage: p.uiLanguage,
    languages: p.languages,
  }
}

export function DetailsScreen({ mode }: { mode: 'signup' | 'settings' }) {
  const {
    draft,
    error,
    authStatus,
    participant,
    goTo,
    submitOnboarding,
    submitSettings,
  } = useSession()

  const defaults =
    mode === 'settings' && participant
      ? profileFromParticipant(participant)
      : {
          name: draft?.name ?? '',
          ageRange: draft?.ageRange ?? undefined,
          gender: draft?.gender ?? undefined,
          genderOther: draft?.genderOther ?? '',
          country: draft?.country ?? '',
          uiLanguage: draft?.uiLanguage ?? 'en',
          languages:
            draft?.languages && draft.languages.length > 0
              ? draft.languages
              : [{ language: '', fluency: 'native' }],
        }

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onSubmit',
    defaultValues: defaults,
  })

  const gender = watch('gender')
  const blocked = isSubmitting || authStatus !== 'ready'

  return (
    <Panel className="max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-purple text-balance sm:text-4xl">
          Tell us a bit about yourself
        </h1>
      </div>

      <form
        onSubmit={handleSubmit((values) =>
          mode === 'settings' ? submitSettings(values) : submitOnboarding(values),
        )}
        noValidate
        className="flex flex-col gap-5"
      >
        <div>
          <FieldLabel htmlFor="name" icon={<User />}>
            Your name or nickname
          </FieldLabel>
          <TextInput
            id="name"
            autoComplete="off"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="name-error" message={errors.name?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="ageRange" icon={<CalendarRange />}>
            Age range
          </FieldLabel>
          <NativeSelect
            id="ageRange"
            aria-invalid={!!errors.ageRange}
            aria-describedby={errors.ageRange ? 'age-error' : undefined}
            {...register('ageRange')}
          >
            <option value="" disabled>
              Select your range…
            </option>
            {AGE_RANGES.map((range) => (
              <option key={range} value={range}>
                {range === '80+' ? '80 or older' : `${range} years`}
              </option>
            ))}
          </NativeSelect>
          <FieldError id="age-error" message={errors.ageRange?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="gender" icon={<Users />}>
            Gender
          </FieldLabel>
          <NativeSelect
            id="gender"
            aria-invalid={!!errors.gender}
            aria-describedby={errors.gender ? 'gender-error' : undefined}
            {...register('gender')}
          >
            <option value="" disabled>
              Select an option…
            </option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError id="gender-error" message={errors.gender?.message} />

          {gender === 'other' ? (
            <div className="mt-3">
              <TextInput
                aria-label="Please specify your gender"
                placeholder="Please specify…"
                aria-invalid={!!errors.genderOther}
                aria-describedby={errors.genderOther ? 'gender-other-error' : undefined}
                {...register('genderOther')}
              />
              <FieldError id="gender-other-error" message={errors.genderOther?.message} />
            </div>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="country" icon={<Globe />}>
            Country
          </FieldLabel>
          <NativeSelect
            id="country"
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? 'country-error' : undefined}
            {...register('country')}
          >
            <option value="" disabled>
              Select your country…
            </option>
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError id="country-error" message={errors.country?.message} />
        </div>

        <div>
          <FieldLabel icon={<Languages />}>Languages you speak</FieldLabel>
          <Controller
            control={control}
            name="languages"
            render={({ field }) => (
              <LanguagePicker
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.languages}
              />
            )}
          />
          <FieldError
            message={
              errors.languages?.message ??
              errors.languages?.root?.message ??
              (Array.isArray(errors.languages)
                ? errors.languages.find(Boolean)?.language?.message
                : undefined)
            }
          />
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
            onClick={() => goTo(mode === 'settings' ? 'title' : 'signin')}
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
            Continue
            <ArrowRight className="size-6" />
          </button>
        </div>
      </form>
    </Panel>
  )
}
