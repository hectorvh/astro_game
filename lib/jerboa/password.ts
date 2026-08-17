import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

const KEY_LENGTH = 64

/** Store only this string. Never log the password or the derived key. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(':')
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(keyHex, 'hex')
  const actual = (await scrypt(password, salt, expected.length)) as Buffer
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
