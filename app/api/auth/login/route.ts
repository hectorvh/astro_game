import { credentialsSchema } from '@/lib/jerboa/schema'
import { verifyPassword } from '@/lib/jerboa/password'
import {
  findAccountByUserid,
  loadAuthSession,
} from '@/lib/jerboa/account-queries'
import {
  setAccountId,
  setParticipantId,
} from '@/lib/jerboa/participant-session'
import { postgresFacingMessage } from '@/lib/jerboa/postgres-errors'

export const runtime = 'nodejs'

const INVALID = 'User ID or password is not correct.'

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

  try {
    const account = await findAccountByUserid(parsed.data.userid)
    if (!account || !(await verifyPassword(parsed.data.password, account.password_hash))) {
      return Response.json({ error: INVALID }, { status: 401 })
    }

    await setAccountId(account.id)
    if (account.user_id) {
      await setParticipantId(account.user_id)
    }

    return Response.json(await loadAuthSession(account))
  } catch (cause) {
    console.error('Log in failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
