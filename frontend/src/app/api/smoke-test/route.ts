/**
 * POST /api/smoke-test
 * Smoke test complet : tenant, user, click-everywhere, CRUD partenaire + opportunité.
 * Résultats écrits dans /app/uploads/smoke-tests/smoke-<ts>.json
 */
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { query } from '@/lib/db'
import { db }    from '@/db'
import { tenants }       from '@/db/schema/core'
import { partners, opportunities } from '@/db/schema/crm'
import { eq } from 'drizzle-orm'

const SMOKE_TOKEN  = process.env.SMOKE_TEST_TOKEN || 'smoke_e2e_moondust_2025'
const UPLOADS_DIR  = '/app/uploads/smoke-tests'
const SELF_URL     = 'http://localhost:3000'

// ── Types ────────────────────────────────────────────────────────
interface StepResult {
  step:        string
  status:      'ok' | 'error' | 'skip'
  code?:       number
  message?:    string
  data?:       unknown
  duration_ms: number
  ts:          string
}

interface SmokeReport {
  run_at:        string
  tenant_slug:   string
  tenant_email:  string
  total:         number
  ok:            number
  errors:        number
  file?:         string
  steps:         StepResult[]
}

// Exécute une étape et capture ok / error
async function step(
  name: string,
  fn: () => Promise<{ code?: number; data?: unknown; message?: string }>
): Promise<StepResult> {
  const t0 = Date.now()
  const ts = new Date().toISOString()
  try {
    const r = await fn()
    return { step: name, status: 'ok', code: r.code ?? 200, data: r.data, message: r.message, duration_ms: Date.now() - t0, ts }
  } catch (err) {
    return { step: name, status: 'error', message: err instanceof Error ? err.message : String(err), duration_ms: Date.now() - t0, ts }
  }
}

// ── Route principale ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* no-op */ }

  if (body.token !== SMOKE_TOKEN) {
    return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
  }

  const runAt     = new Date().toISOString()
  const slugRaw   = ((body.slug as string | undefined) || `smoketest${Date.now().toString(36)}`).toLowerCase()
  const slug      = slugRaw.replace(/[^a-z0-9]/g, '').substring(0, 20)
  const email     = (body.email as string | undefined) || `smoke-${Date.now()}@test.moondust.cloud`
  const password  = (body.password as string | undefined) || 'SmokeTest2025!'
  const steps: StepResult[] = []

  let tenantId:    number | null = null
  let partnerId:   number | null = null
  let opportunityId: number | null = null

  // ── 1. Déclarer la config tenant ────────────────────────────
  steps.push({
    step: '01_declare_config',
    status: 'ok',
    message: `slug=${slug} | email=${email}`,
    data: { slug, email, password: '***' },
    duration_ms: 0,
    ts: new Date().toISOString(),
  })

  // ── 2. Créer le tenant + son user admin ──────────────────────
  steps.push(await step('02_create_tenant_and_user', async () => {
    const res  = await fetch(`${SELF_URL}/api/tenants/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ slug, name: 'Smoke Test User', email, password }),
      cache:   'no-store',
    })
    const data = await res.json() as Record<string, unknown>
    if (!res.ok || data.error) throw new Error((data.error as string) || `HTTP ${res.status}`)
    return { data, message: `Tenant «${slug}» + user créés → ${data.url as string}` }
  }))

  // ── 3. Vérifier le tenant dans erp_tenants ──────────────────
  steps.push(await step('03_verify_tenant_exists', async () => {
    const [row] = await db.select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, slug))
    if (!row) throw new Error(`Tenant ${slug} introuvable dans erp_tenants`)
    tenantId = row.id
    return { message: `Tenant «${row.slug}» confirmé (id=${row.id})` }
  }))

  // ── 4. Click-everywhere : vérifier chaque table métier ──────
  const BUSINESS_TABLES = [
    'partners', 'opportunities', 'contracts', 'projects',
    'tasks', 'invoices', 'activities',
    'supplier_contracts', 'purchase_orders', 'supplier_invoices',
  ]

  for (const table of BUSINESS_TABLES) {
    steps.push(await step(`04_check_${table}`, async () => {
      const rows = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${table}`
      )
      const count = rows[0]?.count ?? '?'
      return { data: { count }, message: `${table} accessible (${count} lignes)` }
    }))
  }

  // ── 5. Créer un partenaire de test ───────────────────────────
  if (tenantId !== null) {
    steps.push(await step('05_create_partner', async () => {
      const [row] = await db.insert(partners).values({
        tenantId: tenantId!,
        isCompany: false,
        name:      'SMOKE TEST USER',
        firstName: 'Smoke',
        email,
        type:      'prospect',
      }).returning({ id: partners.id })
      if (!row?.id) throw new Error('ID partenaire manquant après insertion')
      partnerId = row.id
      return { data: { id: partnerId }, message: `Partenaire créé (id=${partnerId})` }
    }))
  }

  // ── 6. Créer une opportunité de test ─────────────────────────
  if (tenantId !== null && partnerId !== null) {
    steps.push(await step('06_create_opportunity', async () => {
      const [row] = await db.insert(opportunities).values({
        tenantId:  tenantId!,
        name:      '[SMOKE] Opportunité test',
        partnerId: partnerId!,
        stage:     'lead',
      }).returning({ id: opportunities.id })
      if (!row?.id) throw new Error('ID opportunité manquant après insertion')
      opportunityId = row.id
      return { data: { id: opportunityId }, message: `Opportunité créée (id=${opportunityId})` }
    }))
  }

  // ── 7. Relire le partenaire ──────────────────────────────────
  if (partnerId !== null) {
    steps.push(await step('07_read_partner', async () => {
      const [row] = await db.select().from(partners).where(eq(partners.id, partnerId!))
      if (!row) throw new Error('Partenaire introuvable en lecture')
      return { data: { id: row.id, name: row.name }, message: 'Partenaire relu avec succès' }
    }))
  }

  // ── 8. Relire l'opportunité ──────────────────────────────────
  if (opportunityId !== null) {
    steps.push(await step('08_read_opportunity', async () => {
      const [row] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId!))
      if (!row) throw new Error('Opportunité introuvable en lecture')
      return { data: { id: row.id, name: row.name }, message: 'Opportunité relue avec succès' }
    }))
  }

  // ── 9. Cleanup records ───────────────────────────────────────
  if (opportunityId !== null) {
    steps.push(await step('09a_delete_opportunity', async () => {
      await db.delete(opportunities).where(eq(opportunities.id, opportunityId!))
      return { message: `Opportunité ${opportunityId} supprimée` }
    }))
  }

  if (partnerId !== null) {
    steps.push(await step('09b_delete_partner', async () => {
      await db.delete(partners).where(eq(partners.id, partnerId!))
      return { message: `Partenaire ${partnerId} supprimé` }
    }))
  }

  if (tenantId !== null) {
    steps.push(await step('09c_delete_tenant', async () => {
      await db.delete(tenants).where(eq(tenants.id, tenantId!))
      return { message: `Tenant ${slug} (id=${tenantId}) supprimé` }
    }))
  }

  // ── 10. Écrire fichier résultats ─────────────────────────────
  const errCount = steps.filter(s => s.status === 'error').length
  const report: SmokeReport = {
    run_at:       runAt,
    tenant_slug:  slug,
    tenant_email: email,
    total:        steps.length,
    ok:           steps.filter(s => s.status === 'ok').length,
    errors:       errCount,
    steps,
  }

  try {
    await mkdir(UPLOADS_DIR, { recursive: true })
    const filename = `smoke-${runAt.replace(/[:.]/g, '-')}.json`
    await writeFile(path.join(UPLOADS_DIR, filename), JSON.stringify(report, null, 2), 'utf-8')
    report.file = filename
  } catch {
    /* écriture non-fatale */
  }

  return NextResponse.json(report, { status: errCount === 0 ? 200 : 207 })
}
