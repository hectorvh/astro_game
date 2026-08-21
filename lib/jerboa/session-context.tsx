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
import { onboardingSchema } from './schema'
import type { ParticipantRecord } from './types'
import { CONSENT_VERSION } from './constants'
import { ensureAnonymousSession, startFreshAnonymousSession } from './auth'
import { createAccount, logIn, saveParticipant, signUp } from './data-access'

export type Step =
  | 'intro'
  | 'welcome'
  | 'signin'
  | 'login'
  | 'userdatasetup'
  | 'settings'
  | 'information'
  | 'consent'
  | 'title'
  | 'map'
  | 'minigame1'
  | 'jerboa3d'
  | 'bird3d'
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
  credentials: Credentials | null
  consentGiven: boolean
  isGuest: boolean
  error: string | null
  authStatus: AuthStatus
  goTo: (step: Step) => void
  patchDraft: (partial: Partial<OnboardingValues>) => void
  startLogIn: () => Promise<void>
  startSignIn: () => Promise<void>
  enterAsGuest: () => void
  submitSignUp: (credentials: Credentials) => Promise<void>
  submitLogIn: (credentials: Credentials) => Promise<void>
  submitOnboarding: (values: OnboardingValues) => Promise<void>
  submitSettings: (values: OnboardingValues) => Promise<void>
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

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step>('intro')
  const [participant, setParticipant] = useState<ParticipantRecord | null>(null)
  const [draft, setDraft] = useState<Partial<OnboardingValues> | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
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

  const dropAccount = useCallback(async (keepUiLanguage: boolean) => {
    const uiLanguage = keepUiLanguage ? (draft?.uiLanguage ?? 'en') : undefined
    setParticipant(null)
    setCredentials(null)
    setConsentGiven(false)
    setIsGuest(false)
    setDraft(uiLanguage ? { uiLanguage } : null)
    await startFreshAnonymousSession()
  }, [draft?.uiLanguage])

  const startLogIn = useCallback(async () => {
    setError(null)
    try {
      await dropAccount(true)
      goTo('login')
    } catch (cause) {
      setError(messageFor(cause))
    }
  }, [dropAccount, goTo])

  const startSignIn = useCallback(async () => {
    setError(null)
    try {
      await dropAccount(true)
      goTo('signin')
    } catch (cause) {
      setError(messageFor(cause))
    }
  }, [dropAccount, goTo])

  const enterAsGuest = useCallback(() => {
    setError(null)
    setParticipant(null)
    setCredentials(null)
    setConsentGiven(false)
    setIsGuest(true)
    goTo('title')
  }, [goTo])

  const submitSignUp = useCallback(
    async (values: Credentials) => {
      setError(null)
      try {
        await signUp(values)
        setCredentials(values)
        setParticipant(null)
        setConsentGiven(false)
        goTo('userdatasetup')
      } catch (cause) {
        setError(messageFor(cause))
      }
    },
    [goTo],
  )

  const submitLogIn = useCallback(
    async (values: Credentials) => {
      setError(null)
      try {
        const session = await logIn(values)
        setCredentials(null)
        setParticipant(session.participant)
        setConsentGiven(session.consentGiven)
        setIsGuest(false)
        if (session.participant) setDraft(profileDraft(session.participant))
        goTo('title')
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
      goTo('information')
    },
    [goTo],
  )

  const submitSettings = useCallback(
    async (values: OnboardingValues) => {
      setError(null)
      if (!participant) {
        setError('Please log in again to save your answers.')
        return
      }
      try {
        const saved = await saveParticipant(values, participant.id)
        setParticipant(saved)
        setDraft(profileDraft(saved))
        goTo('title')
      } catch (cause) {
        setError(messageFor(cause))
      }
    },
    [participant, goTo],
  )

  const submitConsent = useCallback(
    async (agreed: boolean) => {
      setError(null)
      if (!agreed) {
        setCredentials(null)
        setParticipant(null)
        setDraft(null)
        setConsentGiven(false)
        goTo('declined')
        return
      }

      const parsed = onboardingSchema.safeParse(draft)
      if (!credentials || !parsed.success) {
        setError('Please go back and complete your user ID and details first.')
        return
      }

      try {
        const session = await createAccount({
          userid: credentials.userid,
          password: credentials.password,
          values: parsed.data,
          consentVersion: CONSENT_VERSION,
          agreed: true,
        })
        setCredentials(null)
        setParticipant(session.participant)
        setConsentGiven(true)
        setIsGuest(false)
        if (session.participant) setDraft(profileDraft(session.participant))
        goTo('title')
      } catch (cause) {
        setError(messageFor(cause))
      }
    },
    [credentials, draft, goTo],
  )

  const resetSession = useCallback(() => {
    setParticipant(null)
    setDraft(null)
    setCredentials(null)
    setConsentGiven(false)
    setIsGuest(false)
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
      credentials,
      consentGiven,
      isGuest,
      error,
      authStatus,
      goTo,
      patchDraft,
      startLogIn,
      startSignIn,
      enterAsGuest,
      submitSignUp,
      submitLogIn,
      submitOnboarding,
      submitSettings,
      submitConsent,
      resetSession,
    }),
    [
      step,
      participant,
      draft,
      credentials,
      consentGiven,
      isGuest,
      error,
      authStatus,
      goTo,
      patchDraft,
      startLogIn,
      startSignIn,
      enterAsGuest,
      submitSignUp,
      submitLogIn,
      submitOnboarding,
      submitSettings,
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
