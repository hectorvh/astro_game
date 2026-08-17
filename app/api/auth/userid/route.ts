import { credentialsSchema } from '@/lib/jerboa/schema'
import { findUserByUserid } from '@/lib/jerboa/user-queries'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = credentialsSchema.pick({ userid: true }).safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your answers.' },
      { status: 400 },
    )
  }

  const existing = await findUserByUserid(parsed.data.userid)
  if (existing) {
    return Response.json(
      { error: 'That user ID is already taken. Please choose another.' },
      { status: 409 },
    )
  }

  return Response.json({ available: true })
}
