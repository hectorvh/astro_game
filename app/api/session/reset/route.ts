import { clearSessionCookies } from '@/lib/jerboa/participant-session'

export const runtime = 'nodejs'

/** Drops account and participant cookies so the next save starts a new session. */
export async function POST() {
  await clearSessionCookies()
  return Response.json({ ok: true })
}
