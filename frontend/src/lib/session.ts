import { SignJWT, jwtVerify } from 'jose'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'change_me_in_production_32chars_min'
)

const COOKIE_OPTS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   60 * 60 * 24 * 7,
  path:     '/',
}

export interface SessionPayload {
  sub:    string    // user_id
  email:  string
  role:   number
  tenant: string | null
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export const AUTH_COOKIE      = 'sc_session'
export const USER_ID_COOKIE   = 'sc_user_id'
export const USER_ROLE_COOKIE = 'sc_user_role'

export { COOKIE_OPTS }
