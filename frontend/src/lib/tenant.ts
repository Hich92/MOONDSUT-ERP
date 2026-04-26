import type { NextRequest } from 'next/server'

const BASE_DOMAIN = 'moondust.cloud'
const MAIN_HOST   = process.env.DOMAIN_API || `api.${BASE_DOMAIN}`

/** Extrait le slug tenant depuis le header X-Tenant injecté par Caddy. */
export function getTenantSlug(req: NextRequest): string {
  return req.headers.get('x-tenant') ?? ''
}

/**
 * Retourne le Host à utiliser pour les appels Saltcorn server-side.
 * Saltcorn multi-tenant route sur le Host header.
 */
export function getTenantHost(slug: string): string {
  if (!slug) return MAIN_HOST
  return `${slug}.${BASE_DOMAIN}`
}
