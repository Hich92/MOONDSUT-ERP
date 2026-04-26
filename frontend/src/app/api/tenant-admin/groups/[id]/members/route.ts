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

/** List user IDs in this group */
export async function GET(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  await runMigrations()
  const rows = await query<{ user_id: number }>(
    'SELECT user_id FROM erp_user_groups WHERE group_id=$1 AND tenant=$2',
    [Number(params.id), tenant]
  )
  return NextResponse.json(rows)
}

/** Add a single user to this group */
export async function POST(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const { user_id } = await req.json() as { user_id: number }
  await runMigrations()
  await queryOne(
    `INSERT INTO erp_user_groups(tenant, user_id, group_id)
     VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
    [tenant, user_id, Number(params.id)]
  )
  invalidatePermCache(tenant, user_id)
  return NextResponse.json({ success: true })
}

/** Remove a single user from this group */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const userId = Number(searchParams.get('user_id'))
  await runMigrations()
  await queryOne(
    'DELETE FROM erp_user_groups WHERE group_id=$1 AND tenant=$2 AND user_id=$3',
    [Number(params.id), tenant, userId]
  )
  invalidatePermCache(tenant, userId)
  return NextResponse.json({ success: true })
}
