/**
 * Middleware Next.js — Protection des routes
 * ──────────────────────────────────────────
 * Si le cookie JWT est absent → redirect /login
 * NE vérifie PAS la validité du token ici (Saltcorn le fera au premier appel API).
 * Approche simple et robuste : le serveur est la source de vérité.
 */
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth'

// Routes publiques (pas de protection)
const PUBLIC_PATHS = ['/', '/login', '/signup', '/api/auth/login', '/api/auth/logout', '/api/auth/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer les routes publiques et les assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
