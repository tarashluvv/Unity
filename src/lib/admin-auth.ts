import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'camp-admin-session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

function authSecret(): string {
  return process.env.AUTH_SECRET || ''
}

/** Constant-time comparison against ADMIN_PASSWORD from the server environment. */
export function checkPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (typeof input !== 'string' || !expected) return false
  const a = Buffer.from(input, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function sign(payload: string): string {
  const secret = authSecret()
  if (!secret) return ''
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function createSessionToken(): string {
  const payload = `${Date.now()}.${Math.random().toString(36).slice(2)}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !authSecret()) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [ts, nonce, signature] = parts
  const expected = sign(`${ts}.${nonce}`)
  if (!expected || signature.length !== expected.length) return false
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false
  const issuedAt = Number(ts)
  return Number.isFinite(issuedAt) && issuedAt <= Date.now() && Date.now() - issuedAt < SESSION_TTL_MS
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value)
}
