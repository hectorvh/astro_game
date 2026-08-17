import type { AuthSession, ConsentRecord, ParticipantRecord, TrialRecord } from './types'
import type { CreateAccountInput, Credentials, OnboardingValues, TrialInput } from './schema'
import { getBackendMode } from './backend'
import * as memory from './data-access-memory'
import * as postgres from './data-access-postgres'
import * as supabase from './data-access-supabase'

function backend() {
  switch (getBackendMode()) {
    case 'postgres':
      return postgres
    case 'supabase':
      return supabase
    default:
      return memory
  }
}

/** INSERT on first save, UPDATE on subsequent saves (spec §3, 1.2.C). */
export async function saveParticipant(
  values: OnboardingValues,
  existingId?: string,
): Promise<ParticipantRecord> {
  return backend().saveParticipant(values, existingId)
}

/** Records consent as an auditable row, not just a UI gate (spec §4.3). */
export async function recordConsent(
  userId: string,
  consentVersion: string,
  agreed: boolean,
): Promise<ConsentRecord> {
  return backend().recordConsent(userId, consentVersion, agreed)
}

/** Checks that a userid is free. Does not create a row. */
export async function signUp(credentials: Credentials): Promise<void> {
  return backend().signUp(credentials)
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<AuthSession> {
  return backend().createAccount(input)
}

export async function logIn(credentials: Credentials): Promise<AuthSession> {
  return backend().logIn(credentials)
}

export async function recordTrial(input: TrialInput): Promise<TrialRecord> {
  return backend().recordTrial(input)
}
