import type { AuthSession, ConsentRecord, ParticipantRecord } from './types'
import type { Credentials, OnboardingValues } from './schema'

// Prototype backend: keeps records in memory and logs writes, so every screen
// and navigation rule can be exercised without a database. Deliberately has no
// persistence — a reload starts a clean session.

const store = {
  participants: new Map<string, ParticipantRecord>(),
  consents: [] as ConsentRecord[],
  accounts: new Map<
    string,
    { userid: string; password: string; userId?: string }
  >(),
  currentAccountKey: null as string | null,
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** INSERT on first save, UPDATE on subsequent saves (spec §3, 1.2.C). */
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

  const record: ParticipantRecord = {
    id: uuid(),
    ...values,
    createdAt: now,
    updatedAt: now,
  }
  store.participants.set(record.id, record)
  if (store.currentAccountKey) {
    const account = store.accounts.get(store.currentAccountKey)
    if (account && !account.userId) account.userId = record.id
  }
  console.log('[jerboa] participant INSERT', record)
  return record
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

const accounts = store.accounts

export async function signUp(credentials: Credentials): Promise<AuthSession> {
  const key = credentials.userid.toLowerCase()
  if (accounts.has(key)) {
    throw new Error('That user ID is already taken. Please choose another.')
  }
  accounts.set(key, { userid: credentials.userid, password: credentials.password })
  store.currentAccountKey = key
  return { userid: credentials.userid, participant: null, consentGiven: false }
}

export async function logIn(credentials: Credentials): Promise<AuthSession> {
  const key = credentials.userid.toLowerCase()
  const account = accounts.get(key)
  if (!account || account.password !== credentials.password) {
    throw new Error('User ID or password is not correct.')
  }
  store.currentAccountKey = key
  const participant = account.userId
    ? (store.participants.get(account.userId) ?? null)
    : null
  const consentGiven = participant
    ? store.consents.some((c) => c.userId === participant.id && c.agreed)
    : false
  return { userid: account.userid, participant, consentGiven }
}
