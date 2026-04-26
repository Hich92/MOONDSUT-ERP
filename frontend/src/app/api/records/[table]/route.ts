import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getToken, getUserId, getUserRole } from '@/lib/auth'
import { resolveTenantId } from '@/db/tenant'
import { makePostgRESTClient } from '@/lib/postgrest'
import { emitEvent } from '@/lib/activepieces'
import {
  TABLE_TO_RESOURCE, OWNER_FIELD, INJECT_OWNER_TABLES,
  getUserPermissions, checkAccess, allAccess,
  type PermMap,
} from '@/lib/permissions'

// ── Events post-mutation (fire & forget, alignés sur les contrats) ─

function firePostCreate(table: string, record: Record<string, unknown>, tenantId: number) {
  const r = { ...record, tenantId }
  switch (table) {
    case 'opportunities':
      emitEvent('OPPORTUNITY_CREATED', r).catch(() => {})
      break
    case 'projects':
      emitEvent('PROJECT_CREATED', r).catch(() => {})
      break
    case 'purchase_orders':
      if (record.status === 'sent') emitEvent('PURCHASE_ORDER_SENT', r).catch(() => {})
      break
  }
}

function firePostPatch(table: string, patch: Record<string, unknown>, record: Record<string, unknown>, tenantId: number) {
  const r = { ...record, tenantId }
  switch (table) {
    case 'opportunities':
      if (patch.stage === 'won') emitEvent('OPPORTUNITY_WON', r).catch(() => {})
      break
    case 'contracts':
      if (patch.signed_at) emitEvent('CONTRACT_SIGNED', r).catch(() => {})
      break
    case 'tasks':
      if (patch.status === 'done') emitEvent('TASK_COMPLETED', { ...r, completedAt: new Date().toISOString() }).catch(() => {})
      break
    case 'purchase_orders':
      if (patch.status === 'sent') emitEvent('PURCHASE_ORDER_SENT', r).catch(() => {})
      break
  }
}

// ── Résolution client PostgREST ───────────────────────────────────

async function resolveClient(req: NextRequest) {
  const slug     = getTenantSlug(req)
  const tenantId = slug ? await resolveTenantId(slug) : null
  const userId   = getUserId() ?? 0

  // tenantId null → admin (portal sans X-Tenant) → JWT sans tenant_id → RLS bypass
  return makePostgRESTClient(tenantId, userId)
}

// ── Permissions ───────────────────────────────────────────────────

async function getPermMap(req: NextRequest): Promise<PermMap | null> {
  const tenant = getTenantSlug(req)
  if (!tenant || getUserRole() === 1) return allAccess()

  const userId = getUserId()
  if (!userId) return null

  return getUserPermissions(tenant, userId)
}

// ── GET ───────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const permMap = await getPermMap(req)
  if (permMap === null) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const resource = TABLE_TO_RESOURCE[params.table]
  if (resource) {
    const perm = checkAccess(permMap, resource)
    if (perm.access_level === 'none') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }
  }

  const filters: Record<string, string> = {}
  req.nextUrl.searchParams.forEach((val, key) => { filters[key] = val })

  try {
    const client = await resolveClient(req)
    let result   = await client.list(params.table, Object.keys(filters).length ? filters : undefined)

    // own_only post-fetch filter
    if (resource) {
      const perm = checkAccess(permMap, resource)
      if (perm.own_only) {
        const userId   = getUserId()
        const ownerFld = OWNER_FIELD[resource]
        if (userId && ownerFld) {
          result = result.filter(
            r => String(r[ownerFld]) === String(userId)
          )
        }
      }
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const permMap = await getPermMap(req)
  if (permMap === null) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const resource = TABLE_TO_RESOURCE[params.table]
  if (resource) {
    const perm = checkAccess(permMap, resource)
    if (perm.access_level !== 'edit') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }
  }

  let payload = await req.json()

  // Injecter tenant_id + créateur
  const slug     = getTenantSlug(req)
  const tenantId = slug ? await resolveTenantId(slug) : null
  const userId   = getUserId()

  if (tenantId && !payload.tenant_id) {
    payload = { ...payload, tenant_id: tenantId }
  }
  if (INJECT_OWNER_TABLES.has(params.table) && userId && !payload.created_by_user_id) {
    payload = { ...payload, created_by_user_id: userId }
  }

  try {
    const client = await resolveClient(req)
    const result = await client.create(params.table, payload)
    const id     = result?.id

    if (tenantId) firePostCreate(params.table, result ?? payload, tenantId)

    return NextResponse.json({ success: true, data: result, id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── PATCH ─────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const permMap = await getPermMap(req)
  if (permMap === null) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const resource = TABLE_TO_RESOURCE[params.table]
  if (resource) {
    const perm = checkAccess(permMap, resource)
    if (perm.access_level !== 'edit') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }
  }

  const id      = req.nextUrl.searchParams.get('id')
  const payload = await req.json()

  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  const slug      = getTenantSlug(req)
  const tenantId  = slug ? await resolveTenantId(slug) : null

  try {
    const client = await resolveClient(req)
    const result = await client.update(params.table, Number(id), payload)

    if (tenantId) firePostPatch(params.table, payload, { id: Number(id), ...(result ?? {}) }, tenantId)

    return NextResponse.json({ success: true, data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── DELETE ────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const permMap = await getPermMap(req)
  if (permMap === null) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const resource = TABLE_TO_RESOURCE[params.table]
  if (resource) {
    const perm = checkAccess(permMap, resource)
    if (perm.access_level !== 'edit') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  try {
    const client = await resolveClient(req)
    await client.delete(params.table, Number(id))
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
