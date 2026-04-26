import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'
import { getTenantSlug } from '@/lib/tenant'
import { resolveTenantId } from '@/db/tenant'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const tenantSlug      = getTenantSlug(req)
  const tenantId        = tenantSlug ? await resolveTenantId(tenantSlug) : null

  const [existing] = await db.select({ id: erpUsers.id }).from(erpUsers)
    .where(eq(erpUsers.email, normalizedEmail))

  if (existing) {
    return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(erpUsers).values({
    email:        normalizedEmail,
    name:         name || null,
    passwordHash,
    roleId:       80,
    tenantId:     tenantId ?? null,
  })

  return NextResponse.json({ success: true })
}
