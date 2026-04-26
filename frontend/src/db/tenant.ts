import { db } from '@/db'
import { tenants } from '@/db/schema/core'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

const cache = new Map<string, number>()

export async function resolveTenantId(slug: string): Promise<number | null> {
  if (!slug) return null
  if (cache.has(slug)) return cache.get(slug)!

  const [row] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug))
  if (!row) return null

  cache.set(slug, row.id)
  return row.id
}

/** Résout le tenant depuis le header X-Tenant injecté par Caddy. */
export async function getTenantIdFromRequest(): Promise<number | null> {
  const slug = headers().get('x-tenant') ?? ''
  return resolveTenantId(slug)
}
