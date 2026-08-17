// Domain types for the Jerboa's Journey research instrument.
// Kept free of any DOM/browser APIs so the logic ports cleanly to a
// future React Native / Capacitor mobile build (see spec §2).

export type Fluency = 'native' | 'fluent' | 'intermediate' | 'beginner'

export type Gender = 'male' | 'female' | 'other'

export interface SpokenLanguage {
  /** ISO 639-1 code, e.g. 'es' */
  language: string
  fluency: Fluency
}

/** Mirrors the `users` table in the spec (§4.1). Stored codes, not labels. */
export interface ParticipantRecord {
  id: string
  name: string
  ageRange: string // e.g. '30-39'
  gender: Gender
  genderOther?: string
  country: string // ISO 3166-1 alpha-2, e.g. 'DE'
  uiLanguage: string // e.g. 'en'
  languages: SpokenLanguage[]
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  userid: string
  participant: ParticipantRecord | null
  consentGiven: boolean
}

/** Mirrors the recommended `consents` table (§4.3). */
export interface ConsentRecord {
  userId: string
  consentVersion: string
  agreed: boolean
  timestamp: string
}
