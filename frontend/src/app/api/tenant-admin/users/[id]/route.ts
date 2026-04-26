import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getToken, getUserRole } from '@/lib/auth'
import { resolveTenantId } from '@/db/tenant'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { and, eq } from 'drizzle-orm'

function guard(req: NextRequest) {
  return getTenantSlug(req) && getUserRole() === 1 && getToken()
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!guard(req)) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const tenantId = await resolveTenantId(getTenantSlug(req))
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  const { role_id, disabled } = await req.json() as { role_id?: number; disabled?: boolean }

  if (role_id !== undefined && ![1, 40, 80].includes(role_id)) {
    return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 })
  }

  const updates: Partial<typeof erpUsers.$inferInsert> = {}
  if (role_id !== undefined) updates.roleId   = role_id
  if (disabled !== undefined) updates.disabled = disabled

  await db.update(erpUsers).set(updates)
    .where(and(eq(erpUsers.id, Number(params.id)), eq(erpUsers.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!guard(req)) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const tenantId = await resolveTenantId(getTenantSlug(req))
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  await db.delete(erpUsers)
    .where(and(eq(erpUsers.id, Number(params.id)), eq(erpUsers.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
