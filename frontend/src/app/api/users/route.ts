import { NextRequest, NextResponse } from 'next/server'
import { getToken } from '@/lib/auth'
import { getTenantIdFromRequest } from '@/db/tenant'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq, or, isNull } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  if (!getToken()) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const tenantId = await getTenantIdFromRequest()

  try {
    const users = await db
      .select({ id: erpUsers.id, email: erpUsers.email, name: erpUsers.name, roleId: erpUsers.roleId })
      .from(erpUsers)
      .where(
        tenantId
          ? or(eq(erpUsers.tenantId, tenantId), isNull(erpUsers.tenantId))
          : isNull(erpUsers.tenantId)
      )

    return NextResponse.json({ success: true, data: users })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
