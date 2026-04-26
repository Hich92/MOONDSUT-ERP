import { SignJWT } from 'jose'
import { getTenantIdFromRequest } from '@/db/tenant'
import { getUserId } from '@/lib/auth'

const POSTGREST_URL = process.env.POSTGREST_INTERNAL_URL ?? 'http://postgrest:3001'
const JWT_SECRET    = new TextEncoder().encode(
  process.env.POSTGREST_JWT_SECRET ?? 'moondust_postgrest_jwt_secret_2025_changeme'
)

// ── JWT ───────────────────────────────────────────────────────────

async function makeJWT(tenantId: number | null, userId: number): Promise<string> {
  const claims: Record<string, unknown> = { role: 'postgrest_auth', user_id: userId }
  // Inclure tenant_id uniquement si défini → active le filtrage RLS
  // Sans tenant_id : COALESCE bypass → admin voit tout
  if (tenantId !== null && tenantId > 0) claims.tenant_id = tenantId
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('5m')
    .sign(JWT_SECRET)
}

// ── Traduction filtres Saltcorn → PostgREST ───────────────────────
// Saltcorn : { partner_id: '5', status: 'active' }
// PostgREST: ?partner_id=eq.5&status=eq.active

function toPostgRESTParams(filters: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    // Paramètres PostgREST natifs — passer tel quel
    if (['select', 'order', 'limit', 'offset'].includes(k)) {
      p.set(k, v)
    } else {
      // Equality filter
      p.set(k, `eq.${v}`)
    }
  }
  return p
}

// ── Client ────────────────────────────────────────────────────────

export class PostgRESTClient {
  constructor(private readonly jwt: string) {}

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization:  `Bearer ${this.jwt}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
      Prefer:         'return=representation',
      ...extra,
    }
  }

  async list<T = Record<string, unknown>>(
    table: string,
    filters?: Record<string, string>
  ): Promise<T[]> {
    const url = new URL(`${POSTGREST_URL}/${table}`)
    if (filters && Object.keys(filters).length) {
      toPostgRESTParams(filters).forEach((v, k) => url.searchParams.set(k, v))
    }
    const res = await fetch(url.toString(), { headers: this.headers() })
    if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`)
    return res.json()
  }

  async get<T = Record<string, unknown>>(
    table: string,
    id: number
  ): Promise<T | null> {
    const res = await fetch(`${POSTGREST_URL}/${table}?id=eq.${id}`, {
      headers: this.headers({ Accept: 'application/vnd.pgrst.object+json' }),
    })
    if (res.status === 406 || res.status === 404) return null
    if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`)
    return res.json()
  }

  async create(
    table: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${POSTGREST_URL}/${table}`, {
      method:  'POST',
      headers: this.headers(),
      body:    JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`)
    const rows = await res.json() as Record<string, unknown>[]
    return rows[0] ?? {}
  }

  async update(
    table: string,
    id: number,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${POSTGREST_URL}/${table}?id=eq.${id}`, {
      method:  'PATCH',
      headers: this.headers(),
      body:    JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`)
    const rows = await res.json() as Record<string, unknown>[]
    return rows[0] ?? {}
  }

  async delete(table: string, id: number): Promise<void> {
    const res = await fetch(`${POSTGREST_URL}/${table}?id=eq.${id}`, {
      method:  'DELETE',
      headers: this.headers(),
    })
    if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`)
  }
}

// ── Factory (server-side uniquement) ─────────────────────────────

export async function makePostgRESTClient(
  tenantId: number | null,
  userId: number
): Promise<PostgRESTClient> {
  const jwt = await makeJWT(tenantId, userId)
  return new PostgRESTClient(jwt)
}

/** Factory pour Server Components et Route Handlers — lit le contexte depuis les headers. */
export async function getServerPostgRESTClient(): Promise<PostgRESTClient> {
  const tenantId = await getTenantIdFromRequest()
  const userId   = getUserId() ?? 0
  return makePostgRESTClient(tenantId, userId)
}
