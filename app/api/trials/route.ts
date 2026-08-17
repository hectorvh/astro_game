import { trialSchema } from '@/lib/jerboa/schema'
import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'
import { getParticipantId } from '@/lib/jerboa/participant-session'
import { findUserById } from '@/lib/jerboa/user-queries'
import type { TrialRecord } from '@/lib/jerboa/types'

export const runtime = 'nodejs'

const NOT_LOGGED_IN = 'Please log in again to save your answers.'

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = trialSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your answers.' },
      { status: 400 },
    )
  }

  const userId = await getParticipantId()
  const user = userId ? await findUserById(userId) : null
  if (!user) {
    return Response.json({ error: NOT_LOGGED_IN }, { status: 401 })
  }

  const input = parsed.data

  try {
    const { rows } = await query<{
      id: string
      timestamp: Date | string
    }>(
      `insert into data (
         user_id, minigame, spatial_category, stimulus_id,
         response, is_correct, response_time_ms
       )
       values ($1, $2, $3, $4, $5::jsonb, $6, $7)
       returning id, timestamp`,
      [
        user.id,
        input.minigame,
        input.spatialCategory,
        input.stimulusId,
        JSON.stringify(input.response ?? null),
        input.isCorrect,
        input.responseTimeMs,
      ],
    )

    const row = rows[0]
    if (!row) {
      return Response.json(
        { error: 'We could not save your answers just now. Please try again.' },
        { status: 500 },
      )
    }

    const record: TrialRecord = {
      id: row.id,
      userId: user.id,
      minigame: input.minigame,
      spatialCategory: input.spatialCategory,
      stimulusId: input.stimulusId,
      response: input.response,
      isCorrect: input.isCorrect,
      responseTimeMs: input.responseTimeMs,
      timestamp:
        row.timestamp instanceof Date
          ? row.timestamp.toISOString()
          : String(row.timestamp),
    }
    return Response.json(record)
  } catch (cause) {
    console.error('record_trial failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
