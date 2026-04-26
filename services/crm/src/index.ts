/**
 * erp-crm — Service CRM MoonDust v0.1.2
 * Contrat : contracts/crm.contract.ts
 * Resources: partners, opportunities, activities
 */
import express, { Request, Response, NextFunction } from 'express'
import { Pool }       from 'pg'
import { jwtVerify }  from 'jose'

// ── Config ────────────────────────────────────────────────────────
const PORT    = Number(process.env.PORT ?? 3101)
const MODULE  = 'crm'
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

// ── Types ─────────────────────────────────────────────────────────
interface Session { sub: string; email: string; role: number; tenant: string | null }
interface AuthRequest extends Request { session?: Session; tenantId?: number }

// ── Helpers ───────────────────────────────────────────────────────
const tenantCache = new Map<string, number>()

async function resolveTenantId(slug: string): Promise<number | null> {
  if (tenantCache.has(slug)) return tenantCache.get(slug)!
  const { rows } = await pool.query<{ id: number }>(
    'SELECT id FROM erp_tenants WHERE slug = $1 LIMIT 1', [slug]
  )
  if (!rows[0]) return null
  tenantCache.set(slug, rows[0].id)
  return rows[0].id
}

// ── App ───────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

// ── JWT Auth middleware ────────────────────────────────────────────
async function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim()
  if (!token) return void res.status(401).json({ error: 'Non authentifié' })
  try {
    const { payload } = await jwtVerify(token, SECRET)
    req.session  = payload as unknown as Session
    const tenant = req.session.tenant
    req.tenantId = tenant ? (await resolveTenantId(tenant) ?? undefined) : undefined
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
}

function requireTenant(req: AuthRequest, res: Response): number | null {
  if (!req.tenantId) { res.status(400).json({ error: 'Tenant requis' }); return null }
  return req.tenantId
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

// ── Partners ──────────────────────────────────────────────────────
app.get('/partners', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { type, is_company, q } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM partners WHERE tenant_id = $1'
  if (type)            { params.push(type);                sql += ` AND type = $${params.length}` }
  if (is_company != null) { params.push(is_company === 'true'); sql += ` AND is_company = $${params.length}` }
  if (q)               { params.push(`%${q}%`);           sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})` }
  sql += ' ORDER BY name ASC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.get('/partners/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { rows } = await pool.query(
    'SELECT * FROM partners WHERE tenant_id = $1 AND id = $2 LIMIT 1',
    [tenantId, Number(req.params.id)]
  )
  if (!rows[0]) return void res.status(404).json({ error: 'Introuvable' })
  res.json({ success: true, data: rows[0] })
})

app.post('/partners', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const b = { ...req.body, tenant_id: tenantId }
  const cols = Object.keys(b)
  const vals = Object.values(b)
  const ph   = cols.map((_, i) => `$${i + 1}`)
  const { rows } = await pool.query(
    `INSERT INTO partners (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals
  )
  res.status(201).json({ success: true, data: rows[0] })
})

app.patch('/partners/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const entries = Object.entries(req.body)
  if (!entries.length) return void res.status(400).json({ error: 'Aucun champ' })
  const sets   = entries.map(([k], i) => `${k} = $${i + 3}`)
  const values = entries.map(([, v]) => v)
  const { rows } = await pool.query(
    `UPDATE partners SET ${sets.join(', ')} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, Number(req.params.id), ...values]
  )
  res.json({ success: true, data: rows[0] })
})

app.delete('/partners/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  await pool.query('DELETE FROM partners WHERE tenant_id = $1 AND id = $2', [tenantId, Number(req.params.id)])
  res.json({ success: true })
})

// ── Opportunities ─────────────────────────────────────────────────
app.get('/opportunities', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { stage, partner_id } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM opportunities WHERE tenant_id = $1'
  if (stage)     { params.push(stage);             sql += ` AND stage = $${params.length}` }
  if (partner_id) { params.push(Number(partner_id)); sql += ` AND partner_id = $${params.length}` }
  sql += ' ORDER BY id DESC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.get('/opportunities/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { rows } = await pool.query(
    'SELECT * FROM opportunities WHERE tenant_id = $1 AND id = $2 LIMIT 1',
    [tenantId, Number(req.params.id)]
  )
  if (!rows[0]) return void res.status(404).json({ error: 'Introuvable' })
  res.json({ success: true, data: rows[0] })
})

app.post('/opportunities', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const b = { ...req.body, tenant_id: tenantId }
  const cols = Object.keys(b)
  const vals = Object.values(b)
  const ph   = cols.map((_, i) => `$${i + 1}`)
  const { rows } = await pool.query(
    `INSERT INTO opportunities (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals
  )
  res.status(201).json({ success: true, data: rows[0] })
})

app.patch('/opportunities/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const entries = Object.entries(req.body)
  if (!entries.length) return void res.status(400).json({ error: 'Aucun champ' })
  const sets   = entries.map(([k], i) => `${k} = $${i + 3}`)
  const values = entries.map(([, v]) => v)
  const { rows } = await pool.query(
    `UPDATE opportunities SET ${sets.join(', ')} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, Number(req.params.id), ...values]
  )
  res.json({ success: true, data: rows[0] })
})

// ── Activities ────────────────────────────────────────────────────
app.get('/activities', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { related_table, related_id } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM activities WHERE tenant_id = $1'
  if (related_table) { params.push(related_table); sql += ` AND related_table = $${params.length}` }
  if (related_id)    { params.push(Number(related_id)); sql += ` AND related_id = $${params.length}` }
  sql += ' ORDER BY created_at DESC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.post('/activities', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const b = { ...req.body, tenant_id: tenantId }
  const cols = Object.keys(b)
  const vals = Object.values(b)
  const ph   = cols.map((_, i) => `$${i + 1}`)
  const { rows } = await pool.query(
    `INSERT INTO activities (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals
  )
  res.status(201).json({ success: true, data: rows[0] })
})

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[${MODULE}] v${VERSION} → http://0.0.0.0:${PORT}`)
})

export { app }
