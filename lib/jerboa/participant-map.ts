import type { Gender, ParticipantRecord } from './types'
import type { OnboardingValues } from './schema'

interface UserRow {
  id: string
  name: string | null
  age_range: string
  gender: string
  gender_other: string | null
  country: string
  ui_language: string
  created_at: string
  updated_at: string
}

export function participantFromUserRow(
  row: UserRow,
  languages: OnboardingValues['languages'],
): ParticipantRecord {
  return {
    id: row.id,
    name: row.name ?? '',
    ageRange: row.age_range,
    gender: row.gender as Gender,
    genderOther: row.gender_other ?? undefined,
    country: row.country,
    uiLanguage: row.ui_language,
    languages,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function asUserRow(value: unknown): UserRow | null {
  const row = (typeof value === 'string' ? JSON.parse(value) : value) as
    | UserRow
    | null
  return row?.id ? row : null
}
