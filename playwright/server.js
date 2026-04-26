'use strict'
/**
 * Playwright HTTP runner — écoute sur :3001
 * POST /run            → tests complets (toutes sections), retourne JSON
 * POST /run-tenant     → tests pour un tenant spécifique { tenant, email, password, modules? }
 * GET  /health         → { ok: true }
 */
const express       = require('express')
const { execFile }  = require('child_process')
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const path          = require('path')

const app     = express()
const RESULTS = '/results'
const LATEST  = path.join(RESULTS, 'latest.json')

app.use(express.json())

// ── Health ───────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }))

// ── Run (global — smoke test principal) ─────────────────────────
app.post('/run', (_req, res) => {
  const runAt = new Date().toISOString()

  execFile(
    'npx', ['playwright', 'test', '--reporter=list,json'],
    {
      cwd:     '/app',
      timeout: 180_000,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: LATEST },
    },
    (error, stdout, stderr) => {
      let raw = null
      try { raw = JSON.parse(readFileSync(LATEST, 'utf-8')) } catch { /* pas de fichier */ }

      const summary = formatSummary(raw, runAt, error, stdout, stderr)

      const ts   = runAt.replace(/[:.]/g, '-')
      const file = path.join(RESULTS, `playwright-${ts}.json`)
      try { writeFileSync(file, JSON.stringify(summary, null, 2), 'utf-8') } catch { /* non-fatal */ }
      summary.file = `playwright-${ts}.json`

      res.status(summary.errors > 0 ? 207 : 200).json(summary)
    }
  )
})

// ── Run Tenant ───────────────────────────────────────────────────
// Body: { tenant: string, email: string, password: string, modules?: string[] }
// modules: tableau de patterns grep, ex: ["§3 Partenaires", "§4 Opportunités"]
// Si absent → tous les tests
app.post('/run-tenant', (req, res) => {
  const { tenant, email, password, modules } = req.body || {}

  if (!tenant) return res.status(400).json({ error: 'tenant required' })

  const runAt   = new Date().toISOString()
  const baseURL = `https://${tenant}.moondust.cloud`
  const ts      = runAt.replace(/[:.]/g, '-')
  const outFile = path.join(RESULTS, `tenant-${tenant}-${ts}.json`)

  // Grep pattern for module filtering (e.g. "§3|§4" to run only those sections)
  const grepPattern = modules && modules.length > 0
    ? modules.join('|')
    : null

  const args = ['playwright', 'test', '--reporter=list,json']
  if (grepPattern) args.push('--grep', grepPattern)

  const env = {
    ...process.env,
    PLAYWRIGHT_JSON_OUTPUT_NAME: outFile,
    ERP_EMAIL:    email    || process.env.ERP_EMAIL    || 'admin@test.moondust.cloud',
    ERP_PASSWORD: password || process.env.ERP_PASSWORD || 'TestTenant2025!',
    BASE_URL:     baseURL,
  }

  execFile('npx', args, { cwd: '/app', timeout: 300_000, env }, (error, stdout, stderr) => {
    let raw = null
    try { raw = JSON.parse(readFileSync(outFile, 'utf-8')) } catch { /* pas de fichier */ }

    const summary = formatSummary(raw, runAt, error, stdout, stderr)
    summary.tenant    = tenant
    summary.base_url  = baseURL
    summary.modules   = modules || null
    summary.file      = `tenant-${tenant}-${ts}.json`

    try { writeFileSync(outFile, JSON.stringify(summary, null, 2), 'utf-8') } catch { /* non-fatal */ }

    res.status(summary.errors > 0 ? 207 : 200).json(summary)
  })
})

// ── Format ───────────────────────────────────────────────────────
function formatSummary(raw, runAt, execError, stdout, stderr) {
  if (!raw) {
    return {
      run_at:   runAt,
      total:    0,
      ok:       0,
      errors:   1,
      duration_ms: 0,
      steps: [{
        step:    'playwright_run',
        status:  'error',
        message: execError?.message || 'Fichier JSON non produit',
        ts:      runAt,
        detail:  stderr?.slice(0, 1000) || stdout?.slice(0, 1000),
      }],
    }
  }

  const steps = []

  for (const suite of (raw.suites || [])) {
    collectTests(suite, steps)
  }

  const okCount = steps.filter(s => s.status === 'ok').length

  return {
    run_at:      runAt,
    total:       steps.length,
    ok:          okCount,
    errors:      steps.length - okCount,
    duration_ms: raw.stats?.duration ?? 0,
    summary:     `${okCount === steps.length ? '✅' : '⚠️'} ${okCount}/${steps.length} tests OK`,
    steps,
  }
}

function collectTests(suite, out, parentTitle) {
  const title = parentTitle
    ? `${parentTitle} › ${suite.title}`
    : suite.title

  for (const spec of (suite.specs || [])) {
    const test   = spec.tests?.[0]
    const result = test?.results?.[0]
    const pw_status = result?.status
    const status = pw_status === 'passed' ? 'ok'
                 : pw_status === 'skipped' ? 'skip'
                 : 'error'
    out.push({
      step:        `[PW] ${title ? title + ' › ' : ''}${spec.title}`,
      status,
      duration_ms: result?.duration ?? 0,
      message:     status === 'error'
        ? ((result?.error?.message || pw_status || 'failed').split('\n')[0].slice(0, 200))
        : status === 'skip' ? 'ignoré (dépendance non remplie)' : 'passed',
      ts: new Date().toISOString(),
    })
  }

  for (const child of (suite.suites || [])) {
    collectTests(child, out, title)
  }
}

// ── Start ────────────────────────────────────────────────────────
app.listen(3001, () => console.log('[playwright-runner] Listening on :3001'))
