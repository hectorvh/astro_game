import type { AuthSession, ConsentRecord, ParticipantRecord } from './types'
import type { CreateAccountInput, Credentials, OnboardingValues } from './schema'

// Prototype backend: keeps records in memory and logs writes, so every screen
// and navigation rule can be exercised without a database. Deliberately has no
// persistence — a reload starts a clean session.

const store = {
  participants: new Map<string, ParticipantRecord>(),
  consents: [] as ConsentRecord[],
  users: new Map<
    string,
    { userid: string; password: string; userId: string }
  >(),
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function keyOf(userid: string): string {
  return userid.toLowerCase()
}

/** UPDATE an existing logged-in profile (Settings). */
export async function saveParticipant(
  values: OnboardingValues,
  existingId?: string,
): Promise<ParticipantRecord> {
  const now = new Date().toISOString()

  if (existingId && store.participants.has(existingId)) {
    const prev = store.participants.get(existingId)!
    const updated: ParticipantRecord = { ...prev, ...values, updatedAt: now }
    store.participants.set(existingId, updated)
    console.log('[jerboa] participant UPDATE', updated)
    return updated
  }

  throw new Error('Please log in again to save your answers.')
}

/** Records consent as an auditable row, not just a UI gate (spec §4.3). */
export async function recordConsent(
  userId: string,
  consentVersion: string,
  agreed: boolean,
): Promise<ConsentRecord> {
  const record: ConsentRecord = {
    userId,
    consentVersion,
    agreed,
    timestamp: new Date().toISOString(),
  }
  store.consents.push(record)
  console.log('[jerboa] consent recorded', record)
  return record
}

export async function signUp(credentials: Credentials): Promise<void> {
  if (store.users.has(keyOf(credentials.userid))) {
    throw new Error('That user ID is already taken. Please choose another.')
  }
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<AuthSession> {
  const key = keyOf(input.userid)
  if (store.users.has(key)) {
    throw new Error('That user ID is already taken. Please choose another.')
  }

  const now = new Date().toISOString()
  const record: ParticipantRecord = {
    id: uuid(),
    ...input.values,
    createdAt: now,
    updatedAt: now,
  }
  store.participants.set(record.id, record)
  store.users.set(key, {
    userid: input.userid,
    password: input.password,
    userId: record.id,
  })
  await recordConsent(record.id, input.consentVersion, true)
  console.log('[jerboa] account INSERT', { userid: input.userid, id: record.id })
  return { userid: input.userid, participant: record, consentGiven: true }
}

export async function logIn(credentials: Credentials): Promise<AuthSession> {
  const account = store.users.get(keyOf(credentials.userid))
  if (!account || account.password !== credentials.password) {
    throw new Error('User ID or password is not correct.')
  }
  const participant = store.participants.get(account.userId) ?? null
  return {
    userid: account.userid,
    participant,
    consentGiven: Boolean(participant),
  }
}
