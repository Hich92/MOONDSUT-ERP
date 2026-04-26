/**
 * erp-sales — Service Sales MoonDust v0.1.2
 * Contrat : contracts/sales.contract.ts
 * Resources: contracts, invoices
 */
import express, { Request, Response, NextFunction } from 'express'
import { Pool }       from 'pg'
import { jwtVerify }  from 'jose'

const PORT    = Number(process.env.PORT ?? 3102)
const MODULE  = 'sales'
const VERSION = '0.1.2'
const SECRET  = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'change_me_in_production_32chars_min'
)
const pool = new Pool({
  host:     process.env.POSTGRES_HOST     ?? 'db',
  port:     Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB       ?? 'erp',
  user:     process.env.POSTGRES_USER     ?? 'erp',
  password: process.env.POSTGRES_PASSWORD ?? '',
})

interface Session { sub: string; email: string; role: number; tenant: string | null }
interface AuthRequest extends Request { session?: Session; tenantId?: number }

const tenantCache = new Map<string, number>()
async function resolveTenantId(slug: string): Promise<number | null> {
  if (tenantCache.has(slug)) return tenantCache.get(slug)!
  const { rows } = await pool.query<{ id: number }>('SELECT id FROM erp_tenants WHERE slug = $1 LIMIT 1', [slug])
  if (!rows[0]) return null
  tenantCache.set(slug, rows[0].id)
  return rows[0].id
}

const app = express()
app.use(express.json())

async function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim()
  if (!token) return void res.status(401).json({ error: 'Non authentifié' })
  try {
    const { payload } = await jwtVerify(token, SECRET)
    req.session  = payload as unknown as Session
    const tenant = req.session.tenant
    req.tenantId = tenant ? (await resolveTenantId(tenant) ?? undefined) : undefined
    next()
  } catch { res.status(401).json({ error: 'Token invalide' }) }
}

function requireTenant(req: AuthRequest, res: Response): number | null {
  if (!req.tenantId) { res.status(400).json({ error: 'Tenant requis' }); return null }
  return req.tenantId
}

async function crudInsert(table: string, body: Record<string, unknown>, tenantId: number, pool: Pool) {
  const b    = { ...body, tenant_id: tenantId }
  const cols = Object.keys(b)
  const vals = Object.values(b)
  const ph   = cols.map((_, i) => `$${i + 1}`)
  const { rows } = await pool.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals)
  return rows[0]
}

async function crudPatch(table: string, id: number, body: Record<string, unknown>, tenantId: number, pool: Pool) {
  const entries = Object.entries(body)
  if (!entries.length) return null
  const sets   = entries.map(([k], i) => `${k} = $${i + 3}`)
  const values = entries.map(([, v]) => v)
  const { rows } = await pool.query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, id, ...values]
  )
  return rows[0]
}

// ── Health ────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ module: MODULE, version: VERSION, status: 'ok', db: 'ok', ts: new Date().toISOString() })
  } catch {
    res.status(503).json({ module: MODULE, version: VERSION, status: 'down', db: 'error', ts: new Date().toISOString() })
  }
})

// ── Contracts ─────────────────────────────────────────────────────
app.get('/contracts', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { partner_id, status } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM contracts WHERE tenant_id = $1'
  if (partner_id) { params.push(Number(partner_id)); sql += ` AND partner_id = $${params.length}` }
  if (status)     { params.push(status);             sql += ` AND status = $${params.length}` }
  sql += ' ORDER BY id DESC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.get('/contracts/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { rows } = await pool.query('SELECT * FROM contracts WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, Number(req.params.id)])
  if (!rows[0]) return void res.status(404).json({ error: 'Introuvable' })
  res.json({ success: true, data: rows[0] })
})

app.post('/contracts', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudInsert('contracts', req.body, tenantId, pool)
  res.status(201).json({ success: true, data: row })
})

app.patch('/contracts/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudPatch('contracts', Number(req.params.id), req.body, tenantId, pool)
  if (!row) return void res.status(400).json({ error: 'Aucun champ' })
  res.json({ success: true, data: row })
})

app.delete('/contracts/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  await pool.query('DELETE FROM contracts WHERE tenant_id = $1 AND id = $2', [tenantId, Number(req.params.id)])
  res.json({ success: true })
})

// ── Invoices ──────────────────────────────────────────────────────
app.get('/invoices', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { contract_id, is_paid } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM invoices WHERE tenant_id = $1'
  if (contract_id) { params.push(Number(contract_id)); sql += ` AND contract_id = $${params.length}` }
  if (is_paid != null) { params.push(is_paid === 'true'); sql += ` AND is_paid = $${params.length}` }
  sql += ' ORDER BY id DESC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.get('/invoices/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { rows } = await pool.query('SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, Number(req.params.id)])
  if (!rows[0]) return void res.status(404).json({ error: 'Introuvable' })
  res.json({ success: true, data: rows[0] })
})

app.post('/invoices', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudInsert('invoices', req.body, tenantId, pool)
  res.status(201).json({ success: true, data: row })
})

app.patch('/invoices/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudPatch('invoices', Number(req.params.id), req.body, tenantId, pool)
  if (!row) return void res.status(400).json({ error: 'Aucun champ' })
  res.json({ success: true, data: row })
})

app.delete('/invoices/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  await pool.query('DELETE FROM invoices WHERE tenant_id = $1 AND id = $2', [tenantId, Number(req.params.id)])
  res.json({ success: true })
})

app.listen(PORT, () => console.log(`[${MODULE}] v${VERSION} → http://0.0.0.0:${PORT}`))
export { app }
