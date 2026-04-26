import { NextRequest, NextResponse } from 'next/server'
import { getToken } from '@/lib/auth'
import { getTenantIdFromRequest } from '@/db/tenant'
import { db } from '@/db'
import { activities } from '@/db/schema/crm'
import { and, eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = await getTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 })

  const id      = Number(params.id)
  const payload = await req.json()

  if (payload.status === 'done' || payload.status === 'cancelled') {
    payload.resolvedAt = new Date().toISOString()
  } else if (payload.status === 'open') {
    payload.resolvedAt = null
  }

  try {
    await db.update(activities)
      .set(payload)
      .where(and(eq(activities.tenantId, tenantId), eq(activities.id, id)))
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = await getTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 })

  try {
    await db.delete(activities)
      .where(and(eq(activities.tenantId, tenantId), eq(activities.id, Number(params.id))))
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
