import { createAccountSchema } from '@/lib/jerboa/schema'
import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'
import { hashPassword } from '@/lib/jerboa/password'
import { setParticipantId } from '@/lib/jerboa/participant-session'
import { asUserRow, participantFromUserRow } from '@/lib/jerboa/participant-map'
import { findUserByUserid } from '@/lib/jerboa/user-queries'
import type { AuthSession } from '@/lib/jerboa/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = createAccountSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your answers.' },
      { status: 400 },
    )
  }

  const { userid, password, values, consentVersion } = parsed.data

  try {
    const existing = await findUserByUserid(userid)
    if (existing) {
      return Response.json(
        { error: 'That user ID is already taken. Please choose another.' },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const { rows } = await query<{ user: unknown }>(
      `select create_account(
         $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10
       ) as user`,
      [
        userid,
        passwordHash,
        values.name,
        values.ageRange,
        values.gender,
        values.gender === 'other'
          ? (values.genderOther?.trim() ?? null)
          : null,
        values.country,
        values.uiLanguage,
        JSON.stringify(values.languages),
        consentVersion,
      ],
    )

    const row = asUserRow(rows[0]?.user)
    if (!row) {
      return Response.json(
        { error: 'We could not save your answers just now. Please try again.' },
        { status: 500 },
      )
    }

    await setParticipantId(row.id)

    const session: AuthSession = {
      userid,
      participant: participantFromUserRow(row, values.languages),
      consentGiven: true,
    }
    return Response.json(session)
  } catch (cause) {
    console.error('Create account failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
