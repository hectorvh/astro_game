// Which storage backend the instrument is talking to.
//
// - `postgres`: Next.js route handlers write to the local `jerboa` database.
// - `supabase`: the browser talks to Supabase with the publishable key.
// - `memory`: in-tab Map, lost on reload. Default for `pnpm dev` when nothing
//   is configured, so the UI still runs without a database.

export type BackendMode = 'postgres' | 'supabase' | 'memory'

const EXPLICIT = process.env.NEXT_PUBLIC_JERBOA_BACKEND
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let warned = false

export function getBackendMode(): BackendMode {
  if (EXPLICIT === 'memory') return 'memory'
  if (EXPLICIT === 'postgres') return 'postgres'
  if (EXPLICIT === 'supabase' || (SUPABASE_URL && SUPABASE_KEY)) return 'supabase'

  // A misconfigured production deploy must not silently discard answers.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'No backend is configured. Set NEXT_PUBLIC_JERBOA_BACKEND=postgres ' +
        'with DATABASE_URL, or provide NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or set ' +
        'NEXT_PUBLIC_JERBOA_BACKEND=memory to run without a database.',
    )
  }

  if (!warned) {
    warned = true
    console.warn(
      '[jerboa] No backend configured — running in prototype mode. ' +
        'Answers are kept in memory and lost on reload.',
    )
  }
  return 'memory'
}
