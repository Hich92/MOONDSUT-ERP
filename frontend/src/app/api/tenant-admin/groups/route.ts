import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getUserRole } from '@/lib/auth'
import { query, queryOne, runMigrations } from '@/lib/db'

function guard(req: NextRequest): string | null {
  const tenant = getTenantSlug(req)
  if (!tenant || getUserRole() !== 1) return null
  return tenant
}

export async function GET(req: NextRequest) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  await runMigrations()
  const groups = await query<{
    id: number; name: string; description: string; user_count: number
  }>(`
    SELECT g.id, g.name, g.description,
           COUNT(DISTINCT ug.user_id)::int AS user_count
    FROM   erp_groups g
    LEFT   JOIN erp_user_groups ug ON ug.group_id = g.id AND ug.tenant = $1
    WHERE  g.tenant = $1
    GROUP  BY g.id, g.name, g.description
    ORDER  BY g.name
  `, [tenant])

  return NextResponse.json(groups)
}

export async function POST(req: NextRequest) {
  const tenant = guard(req)
  if (!tenant) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const body = await req.json() as { name?: string; description?: string }
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 })

  await runMigrations()
  const group = await queryOne<{ id: number; name: string }>(
    `INSERT INTO erp_groups(tenant, name, description)
     VALUES($1,$2,$3)
     ON CONFLICT (tenant, name) DO NOTHING
     RETURNING id, name`,
    [tenant, name, body.description?.trim() ?? '']
  )
  if (!group) return NextResponse.json({ error: 'Ce nom de groupe existe déjà.' }, { status: 409 })

  return NextResponse.json({ success: true, group })
}
