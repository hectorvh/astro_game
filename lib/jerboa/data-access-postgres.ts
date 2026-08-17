import type { AuthSession, ConsentRecord, ParticipantRecord } from './types'
import type { CreateAccountInput, Credentials, OnboardingValues } from './schema'

// Browser half of the local-Postgres backend. Talks to Next.js route handlers
// which hold DATABASE_URL and write through the Unix socket. The participant
// id is an httpOnly cookie set by those handlers, so it is not sent here.

const GENERIC_FAILURE =
  'We could not save your answers just now. Please try again.'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'We could not reach the server. Please check your connection and try again.',
    )
  }

  if (!response.ok) {
    let message = GENERIC_FAILURE
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) message = payload.error
    } catch {
      console.error(`${path} responded ${response.status}`)
    }
    throw new Error(message)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new Error(GENERIC_FAILURE)
  }
}

export async function saveParticipant(
  values: OnboardingValues,
  _existingId?: string,
): Promise<ParticipantRecord> {
  return postJson<ParticipantRecord>('/api/participants', { values })
}

export async function recordConsent(
  _userId: string,
  consentVersion: string,
  agreed: boolean,
): Promise<ConsentRecord> {
  return postJson<ConsentRecord>('/api/consents', { consentVersion, agreed })
}

export async function signUp(credentials: Credentials): Promise<void> {
  await postJson<{ available: true }>('/api/auth/userid', {
    userid: credentials.userid,
  })
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<AuthSession> {
  return postJson<AuthSession>('/api/auth/signup', input)
}

export async function logIn(credentials: Credentials): Promise<AuthSession> {
  return postJson<AuthSession>('/api/auth/login', credentials)
}
