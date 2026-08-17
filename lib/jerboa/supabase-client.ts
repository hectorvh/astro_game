import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The single Supabase client for the browser. It carries the *publishable* key,
// which is designed to be public: it grants nothing on its own, because every
// table is protected by Row Level Security keyed to the caller's auth.uid()
// (see supabase/migrations/20260729000000_client_side_rls.sql).
//
// The secret key must never be imported anywhere reachable from a component.

let client: SupabaseClient | null = null

/**
 * Lazily constructed so a missing environment variable surfaces as a handled
 * error at sign-in time rather than crashing module evaluation — which in a
 * client component would blank the whole page.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  client = createClient(url, publishableKey, {
    auth: {
      // Anonymous sessions are per-device by design: persisting them lets a
      // participant reload mid-study and still edit their own row (spec §1.2.C).
      persistSession: true,
      autoRefreshToken: true,
      // No OAuth redirects in this instrument, so URL parsing is dead weight.
      detectSessionInUrl: false,
    },
  })

  return client
}
