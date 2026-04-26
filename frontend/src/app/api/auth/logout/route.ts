import { NextResponse } from 'next/server'
import { AUTH_COOKIE, USER_ID_COOKIE, USER_ROLE_COOKIE } from '@/lib/session'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(AUTH_COOKIE)
  res.cookies.delete(USER_ID_COOKIE)
  res.cookies.delete(USER_ROLE_COOKIE)
  return res
}
