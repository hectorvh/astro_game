import { z } from 'zod'
import { AGE_RANGES } from './constants'

// Single source of truth for onboarding validation AND types (spec §2).

export const fluencySchema = z.enum(['native', 'fluent', 'intermediate', 'beginner'])

export const spokenLanguageSchema = z.object({
  language: z.string().min(1, 'Please choose a language.'),
  fluency: fluencySchema,
})

export const onboardingSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Please enter a name or nickname.')
      .max(80, 'That name is a little too long.'),
    ageRange: z.enum(AGE_RANGES, {
      message: 'Please choose your age range.',
    }),
    gender: z.enum(['male', 'female', 'other'], {
      message: 'Please choose an option.',
    }),
    genderOther: z.string().trim().max(60).optional(),
    country: z.string().min(1, 'Please choose your country.'),
    uiLanguage: z.string().min(1),
    languages: z
      .array(spokenLanguageSchema)
      .min(1, 'Please add at least one language you speak.')
      .refine(
        (list) => new Set(list.map((l) => l.language)).size === list.length,
        { message: 'Each language can only be added once.' },
      ),
  })
  .refine(
    (data) => data.gender !== 'other' || (data.genderOther?.trim().length ?? 0) > 0,
    {
      message: 'Please tell us how you identify.',
      path: ['genderOther'],
    },
  )

export type OnboardingValues = z.infer<typeof onboardingSchema>

export const credentialsSchema = z.object({
  userid: z
    .string()
    .trim()
    .min(3, 'User ID must be at least 3 characters.')
    .max(32, 'User ID is a little too long.')
    .regex(/^[A-Za-z0-9_]+$/, 'Use letters, numbers, and underscores only.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'That password is a little too long.'),
})

export const createAccountSchema = credentialsSchema.extend({
  values: onboardingSchema,
  consentVersion: z.string().min(1),
  agreed: z.literal(true),
})

export type Credentials = z.infer<typeof credentialsSchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>

export const trialSchema = z.object({
  minigame: z.string().min(1),
  spatialCategory: z.enum(['topological', 'motion', 'projective', 'distance']),
  stimulusId: z.string().min(1),
  response: z.unknown(),
  isCorrect: z.boolean().nullable(),
  responseTimeMs: z.number().int().nonnegative().nullable(),
})

export type TrialInput = z.infer<typeof trialSchema>
