import { onboardingSchema } from '@/lib/jerboa/schema'
import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'
import { asUserRow, participantFromUserRow } from '@/lib/jerboa/participant-map'
import {
  getAccountId,
  getParticipantId,
  setParticipantId,
} from '@/lib/jerboa/participant-session'
import { findAccountById } from '@/lib/jerboa/account-queries'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = onboardingSchema.safeParse(
    payload && typeof payload === 'object' && 'values' in payload
      ? (payload as { values: unknown }).values
      : payload,
  )
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your answers.' },
      { status: 400 },
    )
  }

  const values = parsed.data
  const accountId = await getAccountId()
  const account = accountId ? await findAccountById(accountId) : null
  const existingId = account?.user_id ?? (await getParticipantId())

  try {
    const { rows } = await query<{ user: unknown }>(
      `select save_participant(
         $1::uuid, $2, $3, $4, $5, $6, $7, $8::jsonb
       ) as user`,
      [
        existingId ?? null,
        values.name,
        values.ageRange,
        values.gender,
        values.gender === 'other'
          ? (values.genderOther?.trim() ?? null)
          : null,
        values.country,
        values.uiLanguage,
        JSON.stringify(values.languages),
      ],
    )

    const row = asUserRow(rows[0]?.user)
    if (!row) {
      return Response.json(
        { error: 'We could not save your answers just now. Please try again.' },
        { status: 500 },
      )
    }

    if (account && !account.user_id) {
      await query(
        `update accounts set user_id = $1 where id = $2 and user_id is null`,
        [row.id, account.id],
      )
    }

    await setParticipantId(row.id)
    return Response.json(participantFromUserRow(row, values.languages))
  } catch (cause) {
    console.error('save_participant failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
