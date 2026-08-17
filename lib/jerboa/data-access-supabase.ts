import type { PostgrestError } from '@supabase/supabase-js'
import { getSupabaseBrowser } from './supabase-client'
import type { ConsentRecord, Gender, ParticipantRecord } from './types'
import type { OnboardingValues } from './schema'

// Supabase backend (spec §4.4). The browser talks to Supabase directly with the
// publishable key; safety comes from Row Level Security plus anonymous sign-in,
// so a participant can only ever read or write rows whose owner matches the uid
// inside their own JWT. Neither the participant id nor the consent's user_id is
// ever sent by the client — both are defaulted from auth.uid() in the database.
//
// Selected by data-access.ts when the NEXT_PUBLIC_SUPABASE_* variables are set.

/** Message shown to participants when a write cannot be completed. */
const GENERIC_FAILURE =
  'We could not save your answers just now. Please try again.'

/**
 * Database errors are diagnostic, not participant-facing. Constraint names and
 * the exceptions raised by save_participant are matched here so a participant
 * gets an actionable sentence; anything unrecognised falls back to the generic
 * message and the raw error goes to the console.
 */
const FRIENDLY_ERRORS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /not authenticated|JWT|token is expired/i,
    'Your session has expired. Please reload the page to continue.',
  ],
  [
    /at least one spoken language|must keep at least one/i,
    'Please add at least one language you speak.',
  ],
  [/users_name_length/i, 'That name is a little too long.'],
  [
    /user_languages_user_id_language_key/i,
    'Each language can only be added once.',
  ],
  [
    /row-level security/i,
    'Your session is not allowed to save these answers. Please reload the page.',
  ],
  [
    /Failed to fetch|NetworkError|fetch failed/i,
    'We could not reach the server. Please check your connection and try again.',
  ],
]

function participantFacingMessage(cause: unknown): string {
  const raw =
    cause instanceof Error
      ? cause.message
      : typeof (cause as PostgrestError | null)?.message === 'string'
        ? (cause as PostgrestError).message
        : ''

  for (const [pattern, message] of FRIENDLY_ERRORS) {
    if (pattern.test(raw)) return message
  }
  return GENERIC_FAILURE
}

/** Shape returned by save_participant (a jsonb row of the `users` table). */
interface UserRow {
  id: string
  name: string | null
  age_range: string
  gender: string
  gender_other: string | null
  country: string
  ui_language: string
  created_at: string
  updated_at: string
}

/**
 * INSERT on first save, UPDATE on subsequent saves (spec §3, 1.2.C).
 *
 * `existingId` is part of the original interface but is deliberately not sent.
 * The database decides which row this is by reading auth.uid() from the JWT, so
 * a client cannot nominate which participant it writes to — the insert-vs-update
 * branch lives inside save_participant.
 */
export async function saveParticipant(
  values: OnboardingValues,
  existingId?: string,
): Promise<ParticipantRecord> {
  const supabase = getSupabaseBrowser()

  const { data, error } = await supabase.rpc('save_participant', {
    p_name: values.name,
    p_age_range: values.ageRange,
    p_gender: values.gender,
    p_gender_other:
      values.gender === 'other' ? (values.genderOther?.trim() ?? null) : null,
    p_country: values.country,
    p_ui_language: values.uiLanguage,
    p_languages: values.languages,
  })

  if (error) {
    console.error('save_participant failed', error)
    throw new Error(participantFacingMessage(error))
  }

  // PostgREST returns a single jsonb value for a scalar-returning function;
  // unwrap a one-element array too rather than crash if that ever changes.
  const row = (Array.isArray(data) ? data[0] : data) as UserRow | null
  if (!row?.id) {
    console.error('save_participant returned an unexpected payload', data)
    throw new Error(GENERIC_FAILURE)
  }

  return {
    id: row.id,
    name: row.name ?? '',
    ageRange: row.age_range,
    gender: row.gender as Gender,
    genderOther: row.gender_other ?? undefined,
    country: row.country,
    uiLanguage: row.ui_language,
    // Echoed from the submitted values: the function rewrites the language set
    // wholesale, so these are exactly the rows that now exist.
    languages: values.languages,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Records consent as an auditable row, not just a UI gate (spec §4.3).
 *
 * `userId` is accepted for interface compatibility but not sent: consents.user_id
 * defaults to auth.uid(), and the insert policy rejects any other value. The
 * table has no UPDATE or DELETE grant, so the decision is append-only.
 */
export async function recordConsent(
  userId: string,
  consentVersion: string,
  agreed: boolean,
): Promise<ConsentRecord> {
  const supabase = getSupabaseBrowser()

  const { data, error } = await supabase
    .from('consents')
    .insert({ consent_version: consentVersion, agreed })
    .select('user_id, consent_version, agreed, timestamp')
    .single()

  if (error || !data) {
    console.error('Recording consent failed', error)
    throw new Error(participantFacingMessage(error))
  }

  return {
    userId: data.user_id as string,
    consentVersion: data.consent_version as string,
    agreed: data.agreed as boolean,
    timestamp: data.timestamp as string,
  }
}

export async function signUp(): Promise<never> {
  throw new Error('Sign in needs the local database. Set NEXT_PUBLIC_JERBOA_BACKEND=postgres.')
}

export async function logIn(): Promise<never> {
  throw new Error('Log in needs the local database. Set NEXT_PUBLIC_JERBOA_BACKEND=postgres.')
}
