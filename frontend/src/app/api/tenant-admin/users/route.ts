import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getToken, getUserRole } from '@/lib/auth'
import { resolveTenantId } from '@/db/tenant'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const tenantSlug = getTenantSlug(req)
  if (!tenantSlug) return NextResponse.json({ error: 'Route réservée aux tenants.' }, { status: 400 })

  if (getUserRole() !== 1 || !getToken()) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  const users = await db
    .select({ id: erpUsers.id, email: erpUsers.email, name: erpUsers.name, roleId: erpUsers.roleId, disabled: erpUsers.disabled })
    .from(erpUsers)
    .where(eq(erpUsers.tenantId, tenantId))

  return NextResponse.json(users)
}
