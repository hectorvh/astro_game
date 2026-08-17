import { credentialsSchema } from '@/lib/jerboa/schema'
import { query } from '@/lib/jerboa/postgres'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'
import { hashPassword } from '@/lib/jerboa/password'
import { setAccountId } from '@/lib/jerboa/participant-session'
import { findAccountByUserid } from '@/lib/jerboa/account-queries'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = credentialsSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your answers.' },
      { status: 400 },
    )
  }

  const { userid, password } = parsed.data

  try {
    const existing = await findAccountByUserid(userid)
    if (existing) {
      return Response.json(
        { error: 'That user ID is already taken. Please choose another.' },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const { rows } = await query<{ id: string; userid: string }>(
      `insert into accounts (userid, password_hash)
       values ($1, $2)
       returning id, userid`,
      [userid, passwordHash],
    )
    const account = rows[0]
    if (!account) {
      return Response.json(
        { error: 'We could not save your answers just now. Please try again.' },
        { status: 500 },
      )
    }

    await setAccountId(account.id)
    return Response.json({
      userid: account.userid,
      participant: null,
      consentGiven: false,
    })
  } catch (cause) {
    console.error('Sign in failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
