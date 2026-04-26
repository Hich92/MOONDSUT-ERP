import Link from 'next/link'
import {
  Building2, Users, Target, FolderKanban, CheckSquare,
  FileText, Receipt, Scale, Plus, TrendingUp,
  BarChart2, Layers, Wallet,
} from 'lucide-react'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { getLocale }           from '@/lib/get-locale'
import { getT }                from '@/lib/i18n'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CompanyTypeChart, ContactsWeekChart, OpportunitiesValueChart } from '@/components/charts/CrmCharts'
import { ProjectsProgressChart, TasksStatusChart }                     from '@/components/charts/OpsCharts'
import { InvoicesChart, ContractsStatusChart }                         from '@/components/charts/FinanceCharts'

// ── Helpers ────────────────────────────────────────────────────────────────

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  d.setHours(0, 0, 0, 0)
  return d
}

function last7DayLabels(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  })
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchAll() {
  const client = await getServerPostgRESTClient()
  const [partners, opportunities, contracts, projects, tasks, invoices] =
    await Promise.allSettled([
      client.list('partners'),
      client.list('opportunities'),
      client.list('contracts'),
      client.list('projects'),
      client.list('tasks'),
      client.list('invoices'),
    ])

  const pt  = partners.status      === 'fulfilled' ? partners.value      : []
  const op  = opportunities.status === 'fulfilled' ? opportunities.value : []
  const cn  = contracts.status     === 'fulfilled' ? contracts.value     : []
  const pr  = projects.status      === 'fulfilled' ? projects.value      : []
  const tk  = tasks.status         === 'fulfilled' ? tasks.value         : []
  const iv  = invoices.status      === 'fulfilled' ? invoices.value      : []

  // ── CRM ───────────────────────────────────────────────────────────────

  // 1. Partners by type
  const byType: Record<string, number> = {}
  for (const c of pt) {
    const t = (c as { type?: string }).type || 'autre'
    byType[t] = (byType[t] ?? 0) + 1
  }
  const companyTypeData = Object.entries(byType).map(([type, count]) => ({ type, count }))

  // 2. Partners added last 7 days
  const weekStart = startOfWeek()
  const labels = last7DayLabels()
  const dayMap: Record<string, number> = {}
  for (const label of labels) dayMap[label] = 0
  for (const c of pt) {
    const raw = (c as { created_at?: string }).created_at
    if (!raw) continue
    const d = new Date(raw)
    if (d < weekStart) continue
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    if (label in dayMap) dayMap[label] = (dayMap[label] ?? 0) + 1
  }
  const contactsWeekData = labels.map(day => ({ day, count: dayMap[day] ?? 0 }))

  // 3. Opportunities value by stage
  const stageMap: Record<string, number> = {}
  for (const o of op) {
    const r = o as { stage?: string; deal_value?: number }
    const s = r.stage || 'autre'
    stageMap[s] = (stageMap[s] ?? 0) + (r.deal_value ?? 0)
  }
  const oppsValueData = Object.entries(stageMap).map(([stage, value]) => ({ stage, value }))

  // ── Opérations ────────────────────────────────────────────────────────

  // 4. Projects progress (< 100%)
  const projectsData = pr
    .filter(p => ((p as { progress?: number }).progress ?? 0) < 100)
    .map(p => ({
      name: ((p as { name?: string }).name ?? 'Projet').substring(0, 20),
      progress: (p as { progress?: number }).progress ?? 0,
    }))
    .slice(0, 8)

  // 5. Tasks by status
  const tkMap: Record<string, number> = {}
  for (const t of tk) {
    const s = (t as { status?: string }).status || 'todo'
    tkMap[s] = (tkMap[s] ?? 0) + 1
  }
  const tasksData = Object.entries(tkMap).map(([status, count]) => ({ status, count }))

  // ── Comptabilité ──────────────────────────────────────────────────────

  // 6. Invoices paid vs unpaid
  let paidTotal = 0, unpaidTotal = 0
  for (const i of iv) {
    const r = i as { is_paid?: boolean; amount_ht?: number }
    if (r.is_paid) paidTotal += r.amount_ht ?? 0
    else unpaidTotal += r.amount_ht ?? 0
  }

  // 7. Contracts by status
  const cnMap: Record<string, number> = {}
  for (const c of cn) {
    const s = (c as { status?: string }).status || 'inconnu'
    cnMap[s] = (cnMap[s] ?? 0) + 1
  }
  const contractsData = Object.entries(cnMap).map(([status, count]) => ({ status, count }))

  // ── Summary stats ─────────────────────────────────────────────────────

  return {
    counts: {
      partners:      pt.length,
      opportunities: op.length,
      contracts:     cn.length,
      projects:      pr.length,
      tasks:         tk.length,
      invoices:      iv.length,
    },
    companyTypeData,
    contactsWeekData,
    oppsValueData,
    projectsData,
    tasksData,
    paidTotal,
    unpaidTotal,
    contractsData,
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await fetchAll()
  const t    = getT(getLocale())
  const {
    counts,
    companyTypeData, contactsWeekData, oppsValueData,
    projectsData, tasksData,
    paidTotal, unpaidTotal, contractsData,
  } = data

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const QUICK_ACTIONS = [
    { href: '/dashboard/partners/new',      icon: Users,        label: '+ Partenaire',   color: 'bg-orange-600 hover:bg-orange-700' },
    { href: '/dashboard/opportunities/new', icon: Target,       label: '+ Opportunité',  color: 'bg-emerald-600 hover:bg-emerald-700' },
    { href: '/dashboard/projects/new',      icon: FolderKanban, label: '+ Projet',       color: 'bg-violet-600 hover:bg-violet-700' },
    { href: '/dashboard/tasks/new',         icon: CheckSquare,  label: '+ Tâche',        color: 'bg-cyan-600 hover:bg-cyan-700' },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b bg-gradient-to-r from-background to-muted/30 px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">MoonDust ERP</span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{total}</span> enregistrement{total > 1 ? 's' : ''} au total
            </p>
          </div>
          {/* KPI strip */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Partenaires', value: counts.partners,      color: 'text-orange-500',  icon: Users },
              { label: 'Opps',        value: counts.opportunities, color: 'text-emerald-500', icon: Target },
              { label: 'Projets',     value: counts.projects,      color: 'text-violet-500',  icon: FolderKanban },
              { label: 'Tâches',      value: counts.tasks,         color: 'text-violet-400',  icon: CheckSquare },
              { label: 'Contrats',    value: counts.contracts,     color: 'text-blue-500',    icon: FileText },
              { label: 'Factures',    value: counts.invoices,      color: 'text-blue-400',    icon: Receipt },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center gap-1.5 text-sm">
                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="font-bold tabular-nums">{s.value}</span>
                  <span className="text-muted-foreground text-xs hidden sm:inline">{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">

        {/* ── Quick Actions ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(a => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`${a.color} text-white flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-px`}
              >
                <Icon className="w-4 h-4" />
                <span>{a.label}</span>
              </Link>
            )
          })}
        </div>

        {/* ════════════════════════════════════════════════════════
            CRM
        ════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded bg-indigo-500" />
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-500">CRM</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Partenaires par type */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <CardTitle>Partenaires par type</CardTitle>
                </div>
                <CardDescription>{counts.partners} partenaire{counts.partners > 1 ? 's' : ''} au total</CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyTypeChart data={companyTypeData} />
              </CardContent>
            </Card>

            {/* Partenaires ajoutés cette semaine */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <CardTitle>Partenaires — 7 derniers jours</CardTitle>
                </div>
                <CardDescription>{contactsWeekData.reduce((a, b) => a + b.count, 0)} ajouté{contactsWeekData.reduce((a, b) => a + b.count, 0) > 1 ? 's' : ''} cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <ContactsWeekChart data={contactsWeekData} />
              </CardContent>
            </Card>

            {/* Valeur des opportunités */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <CardTitle>Valeur des opportunités</CardTitle>
                </div>
                <CardDescription>
                  Pipeline total :{' '}
                  {oppsValueData.reduce((a, b) => a + b.value, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpportunitiesValueChart data={oppsValueData} />
              </CardContent>
            </Card>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            OPÉRATIONS
        ════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded bg-violet-500" />
            <Layers className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-violet-500">Opérations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Progression des projets */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-violet-500" />
                  <CardTitle>Progression des projets</CardTitle>
                </div>
                <CardDescription>
                  {projectsData.length} projet{projectsData.length > 1 ? 's' : ''} en cours (hors 100 %)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectsProgressChart data={projectsData} />
              </CardContent>
            </Card>

            {/* Tâches par statut */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-violet-500" />
                  <CardTitle>Tâches par statut</CardTitle>
                </div>
                <CardDescription>
                  {counts.tasks} tâche{counts.tasks > 1 ? 's' : ''} ·{' '}
                  {tasksData.find(d => d.status === 'overdue' || d.status === 'late')?.count ?? 0} en retard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TasksStatusChart data={tasksData} />
              </CardContent>
            </Card>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            COMPTABILITÉ
        ════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded bg-blue-500" />
            <Wallet className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-500">Comptabilité</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Facturé vs reste */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  <CardTitle>Facturé cette année vs reste à facturer</CardTitle>
                </div>
                <CardDescription>
                  Total :{' '}
                  {(paidTotal + unpaidTotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  {' · '}
                  <span className="text-emerald-600 font-medium">
                    {paidTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} encaissé
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoicesChart paid={paidTotal} unpaid={unpaidTotal} />
              </CardContent>
            </Card>

            {/* Contrats courants */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <CardTitle>Contrats courants</CardTitle>
                </div>
                <CardDescription>
                  {counts.contracts} contrat{counts.contracts > 1 ? 's' : ''} ·{' '}
                  {contractsData.find(d => d.status === 'actif' || d.status === 'active')?.count ?? 0} actif{
                    (contractsData.find(d => d.status === 'actif' || d.status === 'active')?.count ?? 0) > 1 ? 's' : ''
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContractsStatusChart data={contractsData} />
              </CardContent>
            </Card>

          </div>
        </section>

        {/* ── Legal quick-access ──────────────────────────────────── */}
        <section>
          <Link
            href="/dashboard/legal/referentiel"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium hover:border-slate-300 hover:bg-muted/40 transition-all group"
          >
            <Scale className="w-5 h-5 text-slate-500" />
            <span className="flex-1">Référentiel Légal</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </Link>
        </section>

      </div>
    </div>
  )
}
