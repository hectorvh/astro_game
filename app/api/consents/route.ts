import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'
import { getParticipantId } from '@/lib/jerboa/participant-session'
import type { ConsentRecord } from '@/lib/jerboa/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const userId = await getParticipantId()
  if (!userId) {
    return Response.json(
      { error: 'Please log in again to save your answers.' },
      { status: 401 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const body = payload as { consentVersion?: unknown; agreed?: unknown }
  if (typeof body.consentVersion !== 'string' || body.consentVersion.length < 1) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (typeof body.agreed !== 'boolean') {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  try {
    const { rows } = await query<{
      id: string
      consent_version: string
      consent_agreed: boolean
      consent_at: Date | string
    }>(
      `update users
       set consent_version = $2,
           consent_agreed = $3,
           consent_at = now(),
           updated_at = now()
       where id = $1
       returning id, consent_version, consent_agreed, consent_at`,
      [userId, body.consentVersion, body.agreed],
    )

    const row = rows[0]
    if (!row) {
      return Response.json(
        { error: 'Please log in again to save your answers.' },
        { status: 401 },
      )
    }

    const record: ConsentRecord = {
      userId: row.id,
      consentVersion: row.consent_version,
      agreed: row.consent_agreed,
      timestamp:
        row.consent_at instanceof Date
          ? row.consent_at.toISOString()
          : String(row.consent_at),
    }
    return Response.json(record)
  } catch (cause) {
    console.error('Recording consent failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
