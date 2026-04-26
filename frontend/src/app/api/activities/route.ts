import { NextRequest, NextResponse } from 'next/server'
import { getToken, getUserId } from '@/lib/auth'
import { getTenantIdFromRequest } from '@/db/tenant'
import { listActivities, createActivity } from '@/modules/crm/lib'

export async function GET(req: NextRequest) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = await getTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ success: true, data: [] })

  const table = req.nextUrl.searchParams.get('table') ?? undefined
  const id    = req.nextUrl.searchParams.get('id')

  try {
    const data = await listActivities(tenantId, {
      relatedTable: table,
      relatedId:    id ? Number(id) : undefined,
    })
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = await getTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 })

  const userId  = getUserId()
  const payload = await req.json()

  try {
    const id = await createActivity({
      ...payload,
      tenantId,
      createdBy: userId ?? undefined,
    })
    return NextResponse.json({ success: true, id })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
