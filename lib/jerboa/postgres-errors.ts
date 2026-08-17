const GENERIC_FAILURE =
  'We could not save your answers just now. Please try again.'

const FRIENDLY: ReadonlyArray<readonly [RegExp, string]> = [
  [/at least one spoken language|must keep at least one/i,
    'Please add at least one language you speak.'],
  [/users_name_length/i, 'That name is a little too long.'],
  [/user_languages_user_id_language_key/i,
    'Each language can only be added once.'],
  [/unknown participant/i,
    'Please log in again to save your answers.'],
  [/users_userid_lower_idx|users_userid_format|duplicate key.*users/i,
    'That user ID is already taken. Please choose another.'],
  [/ECONNREFUSED|connection refused|database .* does not exist/i,
    'We could not reach the database. Please try again.'],
]

export function postgresFacingMessage(cause: unknown): string {
  const raw = cause instanceof Error ? cause.message : String(cause ?? '')
  for (const [pattern, message] of FRIENDLY) {
    if (pattern.test(raw)) return message
  }
  return GENERIC_FAILURE
}
