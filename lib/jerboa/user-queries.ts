import { query } from './postgres'
import { asUserRow, participantFromUserRow } from './participant-map'
import type { AuthSession, Fluency, ParticipantRecord } from './types'

export interface UserLoginRow {
  id: string
  userid: string
  password_hash: string
}

export async function findUserByUserid(userid: string): Promise<UserLoginRow | null> {
  const { rows } = await query<UserLoginRow>(
    `select id, userid, password_hash
     from users
     where lower(userid) = lower($1)
     limit 1`,
    [userid],
  )
  return rows[0] ?? null
}

export async function findUserById(id: string): Promise<UserLoginRow | null> {
  const { rows } = await query<UserLoginRow>(
    `select id, userid, password_hash
     from users
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function loadAuthSession(user: {
  id: string
  userid: string
}): Promise<AuthSession> {
    const { rows } = await query<{
      user: unknown
      languages: { language: string; fluency: Fluency }[] | string | null
      consent_given: boolean
    }>(
    `select to_jsonb(u.*) as user,
            coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object('language', l.language, 'fluency', l.fluency)
                  order by l.language
                )
                from user_languages l
                where l.user_id = u.id
              ),
              '[]'::jsonb
            ) as languages,
            u.consent_agreed as consent_given
     from users u
     where u.id = $1`,
    [user.id],
  )

  const row = rows[0]
  const profile = asUserRow(row?.user)
  if (!profile || !row) {
    return { userid: user.userid, participant: null, consentGiven: false }
  }

  const languages = Array.isArray(row.languages)
    ? row.languages
    : typeof row.languages === 'string'
      ? (JSON.parse(row.languages) as { language: string; fluency: Fluency }[])
      : []

  const participant: ParticipantRecord = participantFromUserRow(profile, languages)
  return {
    userid: user.userid,
    participant,
    consentGiven: row.consent_given,
  }
}
