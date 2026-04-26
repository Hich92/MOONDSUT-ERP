import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'
import { signSession, AUTH_COOKIE, USER_ID_COOKIE, USER_ROLE_COOKIE, COOKIE_OPTS } from '@/lib/session'
import { getTenantSlug } from '@/lib/tenant'
import { resolveTenantId } from '@/db/tenant'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email et mot de passe requis.' }, { status: 400 })
  }

  const tenantSlug = getTenantSlug(req)
  const tenantId   = tenantSlug ? await resolveTenantId(tenantSlug) : null

  // Cherche l'utilisateur dans erp_users
  const [user] = await db.select().from(erpUsers)
    .where(eq(erpUsers.email, email.toLowerCase().trim()))

  if (!user || user.disabled) {
    return NextResponse.json({ success: false, error: 'Email ou mot de passe incorrect.' }, { status: 401 })
  }

  // Vérifier que l'utilisateur appartient au bon tenant
  if (tenantId && user.tenantId !== null && user.tenantId !== tenantId) {
    return NextResponse.json({ success: false, error: 'Accès non autorisé pour ce tenant.' }, { status: 403 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ success: false, error: 'Email ou mot de passe incorrect.' }, { status: 401 })
  }

  const jwt = await signSession({
    sub:    String(user.id),
    email:  user.email,
    role:   user.roleId,
    tenant: tenantSlug || null,
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set(AUTH_COOKIE,      jwt,                 COOKIE_OPTS)
  res.cookies.set(USER_ID_COOKIE,   String(user.id),     { ...COOKIE_OPTS, httpOnly: false })
  res.cookies.set(USER_ROLE_COOKIE, String(user.roleId), { ...COOKIE_OPTS, httpOnly: false })
  return res
}
