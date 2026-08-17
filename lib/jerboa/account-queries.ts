import { query } from './postgres'
import { asUserRow, participantFromUserRow } from './participant-map'
import type { AuthSession, Fluency, ParticipantRecord } from './types'

interface AccountRow {
  id: string
  userid: string
  user_id: string | null
  password_hash: string
}

export async function findAccountByUserid(userid: string): Promise<AccountRow | null> {
  const { rows } = await query<AccountRow>(
    `select id, userid, user_id, password_hash
     from accounts
     where lower(userid) = lower($1)
     limit 1`,
    [userid],
  )
  return rows[0] ?? null
}

export async function findAccountById(id: string): Promise<AccountRow | null> {
  const { rows } = await query<AccountRow>(
    `select id, userid, user_id, password_hash
     from accounts
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function loadAuthSession(account: {
  userid: string
  user_id: string | null
}): Promise<AuthSession> {
  if (!account.user_id) {
    return { userid: account.userid, participant: null, consentGiven: false }
  }

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
            exists (
              select 1 from consents c
              where c.user_id = u.id and c.agreed = true
            ) as consent_given
     from users u
     where u.id = $1`,
    [account.user_id],
  )

  const row = rows[0]
  const user = asUserRow(row?.user)
  if (!user || !row) {
    return { userid: account.userid, participant: null, consentGiven: false }
  }

  const languages = Array.isArray(row.languages)
    ? row.languages
    : typeof row.languages === 'string'
      ? (JSON.parse(row.languages) as { language: string; fluency: Fluency }[])
      : []

  const participant: ParticipantRecord = participantFromUserRow(user, languages)
  return {
    userid: account.userid,
    participant,
    consentGiven: row.consent_given,
  }
}
