import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getToken, getUserId, getUserRole } from '@/lib/auth'
import { resolveTenantId } from '@/db/tenant'
import { makePostgRESTClient } from '@/lib/postgrest'
import {
  TABLE_TO_RESOURCE, OWNER_FIELD,
  getUserPermissions, checkAccess, allAccess,
  type PermMap,
} from '@/lib/permissions'

type Ctx = { params: { table: string; id: string } }

async function resolveClient(req: NextRequest) {
  const slug     = getTenantSlug(req)
  const tenantId = slug ? await resolveTenantId(slug) : null
  return makePostgRESTClient(tenantId, getUserId() ?? 0)
}

async function getPermMap(req: NextRequest): Promise<PermMap | null> {
  const tenant = getTenantSlug(req)
  if (!tenant || getUserRole() === 1) return allAccess()
  const userId = getUserId()
  if (!userId) return null
  return getUserPermissions(tenant, userId)
}

async function checkEditAccess(
  req: NextRequest, table: string
): Promise<{ ok: boolean; ownOnly: boolean; userId: number | null }> {
  const permMap = await getPermMap(req)
  if (!permMap) return { ok: false, ownOnly: false, userId: null }
  const resource = TABLE_TO_RESOURCE[table]
  if (!resource) return { ok: true, ownOnly: false, userId: getUserId() }
  const perm = checkAccess(permMap, resource)
  if (perm.access_level !== 'edit') return { ok: false, ownOnly: false, userId: null }
  return { ok: true, ownOnly: perm.own_only, userId: getUserId() }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { ok, ownOnly, userId } = await checkEditAccess(req, params.table)
  if (!ok) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  try {
    const client = await resolveClient(req)

    if (ownOnly && userId) {
      const resource = TABLE_TO_RESOURCE[params.table]
      const ownerFld = resource ? OWNER_FIELD[resource] : null
      if (ownerFld) {
        const record = await client.get(params.table, id)
        if (record && String(record[ownerFld]) !== String(userId)) {
          return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
        }
      }
    }

    await client.delete(params.table, id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { ok, ownOnly, userId } = await checkEditAccess(req, params.table)
  if (!ok) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const payload = await req.json()

  try {
    const client = await resolveClient(req)

    if (ownOnly && userId) {
      const resource = TABLE_TO_RESOURCE[params.table]
      const ownerFld = resource ? OWNER_FIELD[resource] : null
      if (ownerFld) {
        const record = await client.get(params.table, id)
        if (record && String(record[ownerFld]) !== String(userId)) {
          return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
        }
      }
    }

    const result = await client.update(params.table, id, payload)
    return NextResponse.json({ success: true, data: result })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
