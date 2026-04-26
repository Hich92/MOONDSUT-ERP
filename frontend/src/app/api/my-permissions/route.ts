import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { getUserId, getUserRole } from '@/lib/auth'
import { getUserPermissions, allAccess } from '@/lib/permissions'
import { runMigrations } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const tenant = getTenantSlug(req)
  const role   = getUserRole()

  // Main tenant or admin: no restriction (no DB needed)
  if (!tenant || role === 1) {
    return NextResponse.json(allAccess())
  }

  const userId = getUserId()
  if (!userId) return NextResponse.json({})

  await runMigrations()
  const perms = await getUserPermissions(tenant, userId)
  return NextResponse.json(perms)
}
