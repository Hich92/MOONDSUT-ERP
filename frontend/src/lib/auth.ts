import { cookies } from 'next/headers'

export const AUTH_COOKIE      = 'sc_session'
export const USER_ID_COOKIE   = 'sc_user_id'
export const USER_ROLE_COOKIE = 'sc_user_role'

export function getToken(): string | null {
  return cookies().get(AUTH_COOKIE)?.value ?? null
}

export function getUserId(): number | null {
  const v = cookies().get(USER_ID_COOKIE)?.value
  return v ? Number(v) : null
}

export function getUserRole(): number | null {
  const v = cookies().get(USER_ROLE_COOKIE)?.value
  return v ? Number(v) : null
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
