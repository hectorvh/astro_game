import { cookies } from 'next/headers'

const PARTICIPANT_COOKIE = 'jerboa_participant'
const ACCOUNT_COOKIE = 'jerboa_account'
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

function readUuid(value: string | undefined): string | undefined {
  return value && UUID.test(value) ? value : undefined
}

export async function getParticipantId(): Promise<string | undefined> {
  const jar = await cookies()
  return readUuid(jar.get(PARTICIPANT_COOKIE)?.value)
}

export async function setParticipantId(id: string): Promise<void> {
  const jar = await cookies()
  jar.set(PARTICIPANT_COOKIE, id, cookieOptions)
}

export async function getAccountId(): Promise<string | undefined> {
  const jar = await cookies()
  return readUuid(jar.get(ACCOUNT_COOKIE)?.value)
}

export async function setAccountId(id: string): Promise<void> {
  const jar = await cookies()
  jar.set(ACCOUNT_COOKIE, id, cookieOptions)
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies()
  jar.delete(PARTICIPANT_COOKIE)
  jar.delete(ACCOUNT_COOKIE)
}
