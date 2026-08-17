import { credentialsSchema } from '@/lib/jerboa/schema'
import { verifyPassword } from '@/lib/jerboa/password'
import { findUserByUserid, loadAuthSession } from '@/lib/jerboa/user-queries'
import { setParticipantId } from '@/lib/jerboa/participant-session'
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
    const user = await findUserByUserid(parsed.data.userid)
    if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
      return Response.json({ error: INVALID }, { status: 401 })
    }

    await setParticipantId(user.id)
    return Response.json(await loadAuthSession(user))
  } catch (cause) {
    console.error('Log in failed', cause)
    return Response.json(
      { error: postgresFacingMessage(cause) },
      { status: 500 },
    )
  }
}
