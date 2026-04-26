'use client'
import { useState } from 'react'
import { FlaskConical, Play, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, RotateCcw } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
interface StepResult {
  step:        string
  status:      'ok' | 'error' | 'skip'
  duration_ms?: number
  message?:    string
  ts?:         string
}

interface SuiteReport {
  run_at?:       string
  tenant_slug?:  string
  tenant_email?: string
  total:         number
  ok:            number
  errors:        number
  summary?:      string
  result_file?:  string
  steps:         StepResult[]
}

interface RunReport {
  api:        SuiteReport | null
  playwright: SuiteReport | null
  running_api: boolean
  running_pw:  boolean
  error?:      string
}

const EMPTY_REPORT: RunReport = {
  api:         null,
  playwright:  null,
  running_api: false,
  running_pw:  false,
}

// ── Helpers ────────────────────────────────────────────────────────
const statusIcon = (s: StepResult['status']) =>
  s === 'ok'   ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
: s === 'error' ? <XCircle      className="w-4 h-4 text-red-500 flex-shrink-0" />
:                 <Clock         className="w-4 h-4 text-slate-400 flex-shrink-0" />

const fmtMs = (ms?: number) =>
  ms === undefined ? '' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

// ── Step table ─────────────────────────────────────────────────────
function StepTable({ report, label }: { report: SuiteReport; label: string }) {
  const bgHeader = label === 'API' ? 'bg-blue-50' : 'bg-violet-50'
  const dot = report.errors === 0
    ? 'bg-emerald-500'
    : 'bg-amber-500'

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className={`px-4 py-3 flex items-center justify-between ${bgHeader}`}>
        <div className="flex items-center gap-2 font-semibold text-sm">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          {label} — {report.ok}/{report.total} OK
          {report.errors > 0 && (
            <span className="ml-1 text-amber-600 text-xs font-normal flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {report.errors} échec{report.errors > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {report.result_file && (
          <span className="text-xs text-muted-foreground font-mono">{report.result_file}</span>
        )}
      </div>
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {report.steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
            {statusIcon(s.status)}
            <span className={`flex-1 font-mono text-xs truncate ${s.status === 'error' ? 'text-red-700' : 'text-foreground'}`}>
              {s.step.replace('[PW] smoke.spec.ts › ', '').replace('[PW] ', '')}
            </span>
            {s.message && s.status === 'error' && (
              <span className="text-xs text-red-500 max-w-[40%] truncate">{s.message}</span>
            )}
            {s.message && s.status === 'ok' && (
              <span className="text-xs text-muted-foreground hidden md:block max-w-[40%] truncate">{s.message}</span>
            )}
            {s.duration_ms !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right flex-shrink-0">
                {fmtMs(s.duration_ms)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────
export default function SmokeTestPage() {
  const [state, setState] = useState<RunReport>(EMPTY_REPORT)

  const isRunning = state.running_api || state.running_pw

  async function runAll() {
    setState({ api: null, playwright: null, running_api: true, running_pw: false })

    // ── 1. Tests API ─────────────────────────────────────────────
    let apiReport: SuiteReport | null = null
    try {
      const res  = await fetch('/api/smoke-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: 'smoke_e2e_moondust_2025' }),
      })
      apiReport = await res.json() as SuiteReport
    } catch (e) {
      apiReport = {
        total: 0, ok: 0, errors: 1,
        steps: [{ step: 'smoke-test', status: 'error', message: String(e) }],
      }
    }
    setState(s => ({ ...s, api: apiReport, running_api: false, running_pw: true }))

    // ── 2. Tests UI Playwright ───────────────────────────────────
    let pwReport: SuiteReport | null = null
    try {
      const res = await fetch('/api/playwright-run', { method: 'POST' })
      pwReport  = await res.json() as SuiteReport
    } catch (e) {
      pwReport = {
        total: 0, ok: 0, errors: 1,
        steps: [{ step: 'playwright', status: 'error', message: String(e) }],
      }
    }
    setState(s => ({ ...s, playwright: pwReport, running_pw: false }))
  }

  const totalOk  = (state.api?.ok ?? 0) + (state.playwright?.ok ?? 0)
  const totalAll = (state.api?.total ?? 0) + (state.playwright?.total ?? 0)
  const hasRun   = state.api !== null || state.playwright !== null

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="page-header">
        <div className="flex items-center gap-3">
          <div className="brand-icon">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h1 className="page-heading">Smoke Tests</h1>
            <p className="text-xs text-muted-foreground">
              Tests API + UI Playwright contre l'ERP en production
            </p>
          </div>
        </div>

        <button
          onClick={runAll}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" />
              {state.running_api ? 'Tests API…' : 'Tests UI…'}
            </>
          ) : hasRun ? (
            <><RotateCcw className="w-4 h-4" /> Relancer</>
          ) : (
            <><Play className="w-4 h-4" /> Lancer les tests</>
          )}
        </button>
      </header>

      <div className="flex-1 p-6 space-y-6">

        {/* Summary badge */}
        {hasRun && !isRunning && (
          <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${
            totalOk === totalAll
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            {totalOk === totalAll
              ? <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              : <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            }
            <div>
              <p className="font-semibold text-sm">
                {totalOk === totalAll
                  ? `✅ Tous les tests passent — ${totalAll}/${totalAll}`
                  : `⚠️ ${totalOk}/${totalAll} tests OK — ${totalAll - totalOk} échec(s)`
                }
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                API : {state.api?.ok ?? 0}/{state.api?.total ?? 0}
                {' · '}
                UI Playwright : {state.playwright?.ok ?? 0}/{state.playwright?.total ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Skeleton pendant le chargement API */}
        {state.running_api && (
          <div className="rounded-xl border border-border bg-blue-50 px-4 py-6 text-center text-sm text-muted-foreground animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Tests API en cours — tenant, CRUD, 11 endpoints…
          </div>
        )}

        {/* Résultats API */}
        {state.api && <StepTable report={state.api} label="API (Saltcorn)" />}

        {/* Skeleton Playwright */}
        {state.running_pw && (
          <div className="rounded-xl border border-border bg-violet-50 px-4 py-6 text-center text-sm text-muted-foreground animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-400" />
            Tests UI Playwright en cours — Chromium headless…
          </div>
        )}

        {/* Résultats Playwright */}
        {state.playwright && <StepTable report={state.playwright} label="UI Playwright" />}

        {/* État initial */}
        {!hasRun && !isRunning && (
          <div className="text-center py-16 text-muted-foreground">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Cliquez sur <strong>Lancer les tests</strong> pour démarrer le smoke test complet.</p>
            <p className="text-xs mt-1 opacity-70">
              20 tests API · 18 tests UI · ~90s au total
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
