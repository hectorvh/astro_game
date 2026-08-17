import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'

export const runtime = 'nodejs'

/** Confirms the local jerboa database is reachable before the form can submit. */
export async function GET() {
  try {
    const { rows } = await query<{
      users: string
      consents: string
      trials: string
    }>(
      `select
         (select count(*)::text from users) as users,
         (select count(*)::text from users where consent_agreed) as consents,
         (select count(*)::text from data) as trials`,
    )
    return Response.json({ ok: true, ...rows[0] })
  } catch (cause) {
    console.error('Database health check failed', cause)
    return Response.json(
      { ok: false, error: postgresFacingMessage(cause) },
      { status: 503 },
    )
  }
}
