'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Credentials, OnboardingValues } from './schema'
import type { ParticipantRecord } from './types'
import { CONSENT_VERSION } from './constants'
import { ensureAnonymousSession, startFreshAnonymousSession } from './auth'
import { logIn, recordConsent, saveParticipant, signUp } from './data-access'

export type Step =
  | 'welcome'
  | 'signin'
  | 'login'
  | 'userdatasetup'
  | 'information'
  | 'consent'
  | 'title'
  | 'map'
  | 'declined'

export const STEP_ORDER: Step[] = [
  'welcome',
  'signin',
  'userdatasetup',
  'information',
  'consent',
  'title',
  'map',
]

export type AuthStatus = 'pending' | 'ready' | 'error'

interface SessionContextValue {
  step: Step
  participant: ParticipantRecord | null
  draft: Partial<OnboardingValues> | null
  consentGiven: boolean
  error: string | null
  authStatus: AuthStatus
  goTo: (step: Step) => void
  patchDraft: (partial: Partial<OnboardingValues>) => void
  submitSignUp: (credentials: Credentials) => Promise<void>
  submitLogIn: (credentials: Credentials) => Promise<void>
  submitOnboarding: (values: OnboardingValues) => Promise<void>
  submitConsent: (agreed: boolean) => Promise<void>
  resetSession: () => void
}

function messageFor(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : 'Something went wrong. Please try again.'
}

function profileDraft(p: ParticipantRecord): Partial<OnboardingValues> {
  return {
    name: p.name,
    ageRange: p.ageRange as OnboardingValues['ageRange'],
    gender: p.gender,
    genderOther: p.genderOther,
    country: p.country,
    uiLanguage: p.uiLanguage,
    languages: p.languages,
  }
}

function hasSavedProfile(p: ParticipantRecord | null): p is ParticipantRecord {
  return Boolean(
    p &&
      p.name.trim() &&
      p.ageRange &&
      p.gender &&
      p.country &&
      p.languages.length > 0,
  )
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step>('welcome')
  const [participant, setParticipant] = useState<ParticipantRecord | null>(null)
  const [draft, setDraft] = useState<Partial<OnboardingValues> | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending')

  useEffect(() => {
    let cancelled = false
    ensureAnonymousSession()
      .then(() => {
        if (!cancelled) setAuthStatus('ready')
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setAuthStatus('error')
        setError(messageFor(cause))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const goTo = useCallback((next: Step) => {
    setStep(next)
    setError(null)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [])

  const patchDraft = useCallback((partial: Partial<OnboardingValues>) => {
    setDraft((prev) => ({ ...prev, ...partial }))
  }, [])

  const submitSignUp = useCallback(
    async (credentials: Credentials) => {
      setError(null)
      try {
        await signUp(credentials)
        goTo('userdatasetup')
      } catch (cause) {
        setError(messageFor(cause))
      }
    },
    [goTo],
  )

  const submitLogIn = useCallback(
    async (credentials: Credentials) => {
      setError(null)
      try {
        const session = await logIn(credentials)
        setParticipant(session.participant)
        setConsentGiven(session.consentGiven)
        if (hasSavedProfile(session.participant)) {
          setDraft(profileDraft(session.participant))
          goTo('title')
        } else {
          goTo('userdatasetup')
        }
      } catch (cause) {
        setError(messageFor(cause))
      }
    },
    [goTo],
  )

  const submitOnboarding = useCallback(
    async (values: OnboardingValues) => {
      setDraft(values)
      setError(null)
      try {
        const saved = await saveParticipant(values, participant?.id)
        setParticipant(saved)
        goTo(participant ? 'title' : 'information')
      } catch (cause) {
        setError(messageFor(cause))
      }
    },
    [participant?.id, goTo],
  )

  const submitConsent = useCallback(
    async (agreed: boolean) => {
      setError(null)
      if (participant) {
        try {
          await recordConsent(participant.id, CONSENT_VERSION, agreed)
        } catch (cause) {
          setError(messageFor(cause))
          return
        }
      }
      setConsentGiven(agreed)
      if (!agreed) {
        setParticipant(null)
        setDraft(null)
      }
      goTo(agreed ? 'title' : 'declined')
    },
    [participant, goTo],
  )

  const resetSession = useCallback(() => {
    setParticipant(null)
    setDraft(null)
    setConsentGiven(false)
    setAuthStatus('pending')
    goTo('welcome')
    startFreshAnonymousSession()
      .then(() => setAuthStatus('ready'))
      .catch((cause: unknown) => {
        setAuthStatus('error')
        setError(messageFor(cause))
      })
  }, [goTo])

  const value = useMemo<SessionContextValue>(
    () => ({
      step,
      participant,
      draft,
      consentGiven,
      error,
      authStatus,
      goTo,
      patchDraft,
      submitSignUp,
      submitLogIn,
      submitOnboarding,
      submitConsent,
      resetSession,
    }),
    [
      step,
      participant,
      draft,
      consentGiven,
      error,
      authStatus,
      goTo,
      patchDraft,
      submitSignUp,
      submitLogIn,
      submitOnboarding,
      submitConsent,
      resetSession,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
