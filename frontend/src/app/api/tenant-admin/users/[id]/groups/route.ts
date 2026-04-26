import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getUserRole } from '@/lib/auth'
import { query, queryOne, runMigrations } from '@/lib/db'
import { invalidatePermCache } from '@/lib/permissions'

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
  const rows = await query<{ group_id: number; name: string }>(
    `SELECT ug.group_id, g.name
     FROM   erp_user_groups ug
     JOIN   erp_groups g ON g.id = ug.group_id
     WHERE  ug.tenant=$1 AND ug.user_id=$2`,
    [tenant, Number(params.id)]
  )

  return NextResponse.json(rows)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const body = await req.json() as { group_ids: number[] }
  const userId = Number(params.id)

  await runMigrations()

  // Replace group memberships atomically
  await queryOne(
    'DELETE FROM erp_user_groups WHERE tenant=$1 AND user_id=$2',
    [tenant, userId]
  )
  for (const gid of body.group_ids ?? []) {
    await queryOne(
      `INSERT INTO erp_user_groups(tenant, user_id, group_id)
       VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
      [tenant, userId, gid]
    )
  }

  invalidatePermCache(tenant, userId)
  return NextResponse.json({ success: true })
}
