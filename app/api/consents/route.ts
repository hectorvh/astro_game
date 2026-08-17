import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'
import { getParticipantId } from '@/lib/jerboa/participant-session'
import type { ConsentRecord } from '@/lib/jerboa/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const userId = await getParticipantId()
  if (!userId) {
    return Response.json(
      { error: 'Your session is not allowed to save these answers. Please reload the page.' },
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
      user_id: string
      consent_version: string
      agreed: boolean
      timestamp: Date | string
    }>(
      `insert into consents (user_id, consent_version, agreed)
       values ($1, $2, $3)
       returning user_id, consent_version, agreed, timestamp`,
      [userId, body.consentVersion, body.agreed],
    )

    const row = rows[0]
    if (!row) {
      return Response.json(
        { error: 'We could not save your answers just now. Please try again.' },
        { status: 500 },
      )
    }

    const record: ConsentRecord = {
      userId: row.user_id,
      consentVersion: row.consent_version,
      agreed: row.agreed,
      timestamp:
        row.timestamp instanceof Date
          ? row.timestamp.toISOString()
          : String(row.timestamp),
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
