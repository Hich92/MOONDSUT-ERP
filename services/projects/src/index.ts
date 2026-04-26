/**
 * erp-projects — Service Projects MoonDust v0.1.2
 * Contrat : contracts/projects.contract.ts
 * Resources: projects, tasks
 */
import express, { Request, Response, NextFunction } from 'express'
import { Pool }       from 'pg'
import { jwtVerify }  from 'jose'

const PORT    = Number(process.env.PORT ?? 3103)
const MODULE  = 'projects'
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

async function crudInsert(table: string, body: Record<string, unknown>, tenantId: number) {
  const b = { ...body, tenant_id: tenantId }
  const cols = Object.keys(b); const vals = Object.values(b)
  const ph = cols.map((_, i) => `$${i + 1}`)
  const { rows } = await pool.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals)
  return rows[0]
}

async function crudPatch(table: string, id: number, body: Record<string, unknown>, tenantId: number) {
  const entries = Object.entries(body); if (!entries.length) return null
  const sets = entries.map(([k], i) => `${k} = $${i + 3}`)
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

// ── Projects ──────────────────────────────────────────────────────
app.get('/projects', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { contract_id, status } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM projects WHERE tenant_id = $1'
  if (contract_id) { params.push(Number(contract_id)); sql += ` AND contract_id = $${params.length}` }
  if (status)      { params.push(status);              sql += ` AND status = $${params.length}` }
  sql += ' ORDER BY id DESC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.get('/projects/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { rows } = await pool.query('SELECT * FROM projects WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, Number(req.params.id)])
  if (!rows[0]) return void res.status(404).json({ error: 'Introuvable' })
  res.json({ success: true, data: rows[0] })
})

app.post('/projects', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudInsert('projects', req.body, tenantId)
  res.status(201).json({ success: true, data: row })
})

app.patch('/projects/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudPatch('projects', Number(req.params.id), req.body, tenantId)
  if (!row) return void res.status(400).json({ error: 'Aucun champ' })
  res.json({ success: true, data: row })
})

app.delete('/projects/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  await pool.query('DELETE FROM projects WHERE tenant_id = $1 AND id = $2', [tenantId, Number(req.params.id)])
  res.json({ success: true })
})

// ── Tasks ─────────────────────────────────────────────────────────
app.get('/tasks', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { project_id, status, assigned_to } = req.query
  const params: unknown[] = [tenantId]
  let sql = 'SELECT * FROM tasks WHERE tenant_id = $1'
  if (project_id)  { params.push(Number(project_id)); sql += ` AND project_id = $${params.length}` }
  if (status)      { params.push(status);             sql += ` AND status = $${params.length}` }
  if (assigned_to) { params.push(Number(assigned_to)); sql += ` AND assigned_to = $${params.length}` }
  sql += ' ORDER BY id DESC'
  const { rows } = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

app.get('/tasks/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const { rows } = await pool.query('SELECT * FROM tasks WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, Number(req.params.id)])
  if (!rows[0]) return void res.status(404).json({ error: 'Introuvable' })
  res.json({ success: true, data: rows[0] })
})

app.post('/tasks', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudInsert('tasks', req.body, tenantId)
  res.status(201).json({ success: true, data: row })
})

app.patch('/tasks/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  const row = await crudPatch('tasks', Number(req.params.id), req.body, tenantId)
  if (!row) return void res.status(400).json({ error: 'Aucun champ' })
  res.json({ success: true, data: row })
})

app.delete('/tasks/:id', auth, async (req: AuthRequest, res) => {
  const tenantId = requireTenant(req, res); if (!tenantId) return
  await pool.query('DELETE FROM tasks WHERE tenant_id = $1 AND id = $2', [tenantId, Number(req.params.id)])
  res.json({ success: true })
})

app.listen(PORT, () => console.log(`[${MODULE}] v${VERSION} → http://0.0.0.0:${PORT}`))
export { app }
