import { getBackendMode } from './backend'
import { getSupabaseBrowser } from './supabase-client'

// Anonymous sign-in gives each participant a real JWT with a stable subject,
// which is what every RLS policy keys on. No email, password, or personal
// identifier is involved: the uid is the pseudonym.
//
// Requires Authentication > Sign In / Providers > Anonymous sign-ins to be
// enabled on the Supabase project. If it is off, sign-in fails and the UI stays
// disabled rather than collecting answers it cannot store.

/** Message participants see when a session cannot be established. */
const SIGN_IN_FAILED =
  'We could not start your session. Please check your connection and reload the page.'

/** Stands in for a uid when there is no Supabase project to sign in to. */
const PROTOTYPE_UID = 'prototype-local-session'

/**
 * Resolves to the participant's uid, reusing the persisted session when there
 * is one so a reload does not create a second participant record.
 */
export async function ensureAnonymousSession(): Promise<string> {
  // Prototype and local-Postgres modes have nothing to authenticate against
  // at Supabase. Postgres still hits /api/health so a down database disables
  // the form instead of collecting answers it cannot store.
  const mode = getBackendMode()
  if (mode === 'memory') return PROTOTYPE_UID
  if (mode === 'postgres') {
    const response = await fetch('/api/health')
    if (!response.ok) {
      throw new Error(SIGN_IN_FAILED)
    }
    return PROTOTYPE_UID
  }

  const supabase = getSupabaseBrowser()

  const { data: existing, error: readError } = await supabase.auth.getSession()
  if (readError) {
    console.error('Reading the stored Supabase session failed', readError)
  }
  if (existing.session?.user.id) {
    return existing.session.user.id
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.session?.user.id) {
    console.error('Anonymous sign-in failed', error)
    throw new Error(SIGN_IN_FAILED)
  }

  return data.session.user.id
}

/**
 * Abandons the current anonymous identity and takes a new one, so "start again"
 * produces a genuinely new participant record instead of overwriting the
 * previous one (save_participant upserts on auth.uid()).
 *
 * The abandoned auth.users row is left behind; see the cleanup note in the
 * deployment docs.
 */
export async function startFreshAnonymousSession(): Promise<string> {
  const mode = getBackendMode()
  if (mode === 'memory') return PROTOTYPE_UID
  if (mode === 'postgres') {
    await fetch('/api/session/reset', { method: 'POST' })
    return ensureAnonymousSession()
  }

  const supabase = getSupabaseBrowser()

  // scope: 'local' — there is no other device to sign out, and a global call
  // would fail for an already-expired token and mask the real work below.
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
  if (signOutError) {
    console.error('Clearing the previous anonymous session failed', signOutError)
  }

  return ensureAnonymousSession()
}
