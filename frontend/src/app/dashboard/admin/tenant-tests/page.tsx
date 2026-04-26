'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical, RefreshCw, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, Building2, AlertCircle, Play,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface TestStep {
  step:        string
  status:      'ok' | 'error' | 'skip'
  duration_ms: number
  message:     string
  ts:          string
}

interface TenantRun {
  tenant:      string
  run_at:      string
  total:       number
  ok:          number
  errors:      number
  duration_ms: number
  summary?:    string
  modules?:    string[] | null
  file?:       string
  steps:       TestStep[]
}

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ run }: { run: TenantRun }) {
  const all_ok = run.errors === 0
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
      all_ok
        ? 'text-green-400 bg-green-400/10 border-green-400/30'
        : 'text-red-400 bg-red-400/10 border-red-400/30'
    }`}>
      {all_ok
        ? <CheckCircle2 className="w-3 h-3" />
        : <XCircle className="w-3 h-3" />}
      {run.ok}/{run.total}
    </span>
  )
}

// ── Step row ──────────────────────────────────────────────────────

function StepRow({ step }: { step: TestStep }) {
  const color = step.status === 'ok'
    ? 'text-green-400'
    : step.status === 'skip'
    ? 'text-slate-500'
    : 'text-red-400'
  const Icon = step.status === 'ok' ? CheckCircle2 : step.status === 'skip' ? Clock : XCircle

  return (
    <div className={`flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0 ${color}`}>
      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono truncate">{step.step}</p>
        {step.status !== 'ok' && step.message && (
          <p className="text-[10px] text-slate-500 mt-0.5 break-words">{step.message}</p>
        )}
      </div>
      <span className="text-[10px] text-slate-600 flex-shrink-0 tabular-nums">
        {step.duration_ms}ms
      </span>
    </div>
  )
}

// ── Run card ──────────────────────────────────────────────────────

function RunCard({ run }: { run: TenantRun }) {
  const [open, setOpen] = useState(false)
  const d = new Date(run.run_at)
  const label = d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <StatusBadge run={run} />
        <span className="text-sm text-slate-300 flex-1">{label}</span>
        {run.duration_ms > 0 && (
          <span className="text-xs text-slate-500 tabular-nums">
            {(run.duration_ms / 1000).toFixed(1)}s
          </span>
        )}
        {run.modules && run.modules.length > 0 && (
          <span className="text-[10px] text-primary/70 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
            {run.modules.join(', ')}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-white/5">
          {run.steps.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Aucun détail disponible.</p>
          ) : (
            <div className="mt-2 max-h-80 overflow-y-auto">
              {run.steps.map((s, i) => <StepRow key={i} step={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tenant section ────────────────────────────────────────────────

function TenantSection({ tenant, runs }: { tenant: string; runs: TenantRun[] }) {
  const [open, setOpen] = useState(true)
  const last = runs[0]

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/10"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{tenant}</p>
          <p className="text-xs text-slate-500">{runs.length} run{runs.length > 1 ? 's' : ''}</p>
        </div>
        {last && <StatusBadge run={last} />}
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="p-4 space-y-2">
          {runs.map((r, i) => <RunCard key={i} run={r} />)}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────

export default function TenantTestsPage() {
  const [runs,    setRuns]    = useState<TenantRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/ap-test-results')
      const data = await res.json() as TenantRun[]
      setRuns(Array.isArray(data) ? data : [])
    } catch {
      setError('Impossible de charger les résultats.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Group by tenant
  const byTenant = runs.reduce<Record<string, TenantRun[]>>((acc, r) => {
    const t = r.tenant || 'unknown'
    ;(acc[t] = acc[t] || []).push(r)
    return acc
  }, {})

  const tenants = Object.keys(byTenant).sort()

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Tests Automatisés — Tenants
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Résultats des tests Playwright déclenchés par Activepieces.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {loading && tenants.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">Chargement…</div>
      ) : tenants.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Play className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">Aucun résultat de test.</p>
          <p className="text-slate-600 text-xs">
            Déclenchez le flow <strong className="text-slate-500">Tenant QA Run</strong> dans Activepieces
            pour lancer les tests sur des tenants aléatoires.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map(t => (
            <TenantSection key={t} tenant={t} runs={byTenant[t]} />
          ))}
        </div>
      )}
    </div>
  )
}
