import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getUserRole } from '@/lib/auth'
import { queryOne, runMigrations } from '@/lib/db'
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
  const group = await queryOne<{ id: number; name: string; description: string }>(
    'SELECT id, name, description FROM erp_groups WHERE id=$1 AND tenant=$2',
    [Number(params.id), tenant]
  )
  if (!group) return NextResponse.json({ error: 'Introuvable.' }, { status: 404 })

  return NextResponse.json(group)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const body = await req.json() as { name?: string; description?: string }

  await runMigrations()
  await queryOne(
    `UPDATE erp_groups SET
       name        = COALESCE($3, name),
       description = COALESCE($4, description)
     WHERE id = $1 AND tenant = $2`,
    [Number(params.id), tenant, body.name?.trim() ?? null, body.description?.trim() ?? null]
  )

  invalidatePermCache(tenant)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  await runMigrations()
  await queryOne(
    'DELETE FROM erp_groups WHERE id=$1 AND tenant=$2',
    [Number(params.id), tenant]
  )

  invalidatePermCache(tenant)
  return NextResponse.json({ success: true })
}
