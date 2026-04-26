import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getUserRole } from '@/lib/auth'
import { query, queryOne, runMigrations } from '@/lib/db'
import { invalidatePermCache, RESOURCES, type AccessLevel } from '@/lib/permissions'

type Ctx = { params: { id: string } }

function guard(req: NextRequest): string | null {
  const tenant = getTenantSlug(req)
  if (!tenant || getUserRole() !== 1) return null
  return tenant
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  await runMigrations()

  const group = await queryOne<{ id: number }>(
    'SELECT id FROM erp_groups WHERE id=$1 AND tenant=$2',
    [Number(params.id), tenant]
  )
  if (!group) return NextResponse.json({ error: 'Groupe introuvable.' }, { status: 404 })

  const rows = await query<{ resource: string; access_level: string; own_only: boolean }>(
    'SELECT resource, access_level, own_only FROM erp_group_permissions WHERE group_id=$1',
    [Number(params.id)]
  )

  // Build full list (all resources, defaults to 'none')
  const map = new Map(rows.map(r => [r.resource, r]))
  const result = RESOURCES.map(({ key }) => ({
    resource:     key,
    access_level: (map.get(key)?.access_level ?? 'none') as AccessLevel,
    own_only:     map.get(key)?.own_only ?? false,
  }))

  return NextResponse.json(result)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  await runMigrations()

  const group = await queryOne<{ id: number }>(
    'SELECT id FROM erp_groups WHERE id=$1 AND tenant=$2',
    [Number(params.id), tenant]
  )
  if (!group) return NextResponse.json({ error: 'Groupe introuvable.' }, { status: 404 })

  const body = await req.json() as Array<{
    resource: string; access_level: AccessLevel; own_only: boolean
  }>

  const groupId = Number(params.id)

  // Delete existing, re-insert (clean upsert)
  await queryOne('DELETE FROM erp_group_permissions WHERE group_id=$1', [groupId])

  for (const p of body) {
    if (!RESOURCES.find(r => r.key === p.resource)) continue
    await queryOne(
      `INSERT INTO erp_group_permissions(group_id, resource, access_level, own_only)
       VALUES($1,$2,$3,$4)`,
      [groupId, p.resource, p.access_level, p.own_only]
    )
  }

  invalidatePermCache(tenant)
  return NextResponse.json({ success: true })
}
