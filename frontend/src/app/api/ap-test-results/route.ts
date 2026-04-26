/**
 * GET  /api/ap-test-results?tenant=xxx  → liste des runs pour ce tenant
 * POST /api/ap-test-results             → enregistrer un résultat (token requis)
 */
import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const RESULTS_DIR  = '/results'
const SMOKE_TOKEN  = process.env.SMOKE_TEST_TOKEN || 'smoke_e2e_moondust_2025'

// ── GET — liste les runs d'un tenant ────────────────────────────
export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get('tenant')?.trim()

  try {
    const files = await readdir(RESULTS_DIR)

    const tenantFiles = tenant
      ? files.filter(f => f.startsWith(`tenant-${tenant}-`) && f.endsWith('.json'))
      : files.filter(f => f.startsWith('tenant-') && f.endsWith('.json'))

    // Sort descending by filename (ISO timestamp embedded)
    tenantFiles.sort((a, b) => b.localeCompare(a))

    const runs = await Promise.all(
      tenantFiles.slice(0, 20).map(async f => {
        try {
          const raw = await readFile(path.join(RESULTS_DIR, f), 'utf-8')
          return JSON.parse(raw)
        } catch {
          return null
        }
      })
    )

    return NextResponse.json(runs.filter(Boolean))
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// ── POST — enregistrer un résultat (appelé par AP flow) ─────────
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-smoke-token') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (token !== SMOKE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const tenant = (body.tenant as string)?.trim()
  if (!tenant) {
    return NextResponse.json({ error: 'tenant required' }, { status: 400 })
  }

  const ts   = new Date().toISOString().replace(/[:.]/g, '-')
  const file = `tenant-${tenant}-${ts}.json`
  const fullPath = path.join(RESULTS_DIR, file)

  try {
    await mkdir(RESULTS_DIR, { recursive: true })
    await writeFile(fullPath, JSON.stringify({ ...body, file, saved_at: new Date().toISOString() }, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, file })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
