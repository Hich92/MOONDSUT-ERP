'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Circle, Clock, AlertTriangle,
  Folder, Activity, ChevronRight, ExternalLink,
  Inbox, RotateCcw, CheckCheck, BarChart2, User,
} from 'lucide-react'
import { Badge }       from '@/components/ui/badge'
import { Button }      from '@/components/ui/button'
import { ScrollArea }  from '@/components/ui/scroll-area'
import { Separator }   from '@/components/ui/separator'
import { cn }          from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

// ── Types ─────────────────────────────────────────────────────────

type TaskType = 'project' | 'activity'
type FilterType = 'all' | 'project' | 'activity'

interface UnifiedTask {
  id:            number
  _taskType:     TaskType
  // project task fields
  title?:        string
  done?:         boolean
  priority?:     string
  project_id?:   number
  notes?:        string
  _project?:     Record<string, unknown> | null
  // activity task fields
  content?:      string
  related_table?: string
  related_id?:   number
  _related?:     Record<string, unknown> | null
  // shared (both tables use assigned_to)
  assigned_to?:  number
  status:        string
  due_date?:     string
  _sc_created?:  string
}

// ── Helpers ───────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

function isTaskDone(t: UnifiedTask) {
  if (t._taskType === 'project') return !!t.done || t.status === 'done'
  return t.status === 'done'
}

function isOverdue(t: UnifiedTask) {
  return !!t.due_date && t.due_date < TODAY && !isTaskDone(t)
}

function getLabel(t: UnifiedTask) {
  if (t._taskType === 'project') return t.title ?? '—'
  return t.content ?? '—'
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }
  catch { return d }
}

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  urgente: { label: 'Urgente', cls: 'bg-red-500/15 text-red-600' },
  haute:   { label: 'Haute',   cls: 'bg-orange-500/15 text-orange-600' },
  normale: { label: 'Normale', cls: 'bg-blue-500/15 text-blue-600' },
  basse:   { label: 'Basse',   cls: 'bg-muted text-muted-foreground' },
}

const STATUS_MAP: Record<string, { label: string; variant: 'secondary'|'info'|'warning'|'success' }> = {
  todo:        { label: 'À faire',   variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'info'      },
  review:      { label: 'Review',   variant: 'warning'   },
  done:        { label: 'Fait',     variant: 'success'   },
  open:        { label: 'Ouvert',   variant: 'info'      },
}

const TABLE_META: Record<string, { label: string; path: string; titleField: string }> = {
  contacts:      { label: 'Contact',      path: '/dashboard/contacts',      titleField: 'first_name' },
  opportunities: { label: 'Opportunité',  path: '/dashboard/opportunities', titleField: 'title'      },
  contracts:     { label: 'Contrat',      path: '/dashboard/contracts',     titleField: 'title'      },
  projects:      { label: 'Projet',       path: '/dashboard/projects',      titleField: 'name'       },
  tasks:         { label: 'Tâche',        path: '/dashboard/tasks',         titleField: 'title'      },
  invoices:      { label: 'Facture',      path: '/dashboard/invoices',      titleField: 'title'      },
}

// ── TaskInbox ──────────────────────────────────────────────────────

export function TaskInbox() {
  const t = useTranslation()

  const [tasks,    setTasks]    = useState<UnifiedTask[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<UnifiedTask | null>(null)
  const [filter,   setFilter]   = useState<FilterType>('all')
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res  = await fetch('/api/my-tasks', { cache: 'no-store' })
      const data = await res.json()
      const list: UnifiedTask[] = data.tasks ?? []
      setTasks(list)
      // Keep selected in sync
      if (selected) {
        const refreshed = list.find(task => task.id === selected.id && task._taskType === selected._taskType)
        setSelected(refreshed ?? null)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const filtered = tasks.filter(task => {
    if (filter === 'project')  return task._taskType === 'project'
    if (filter === 'activity') return task._taskType === 'activity'
    return true
  })

  const pending = filtered.filter(task => !isTaskDone(task))
  const done    = filtered.filter(task => isTaskDone(task))

  async function toggleTask(task: UnifiedTask) {
    setUpdating(task.id)
    try {
      if (task._taskType === 'project') {
        const isDone = isTaskDone(task)
        await fetch(`/api/records/tasks/${task.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ done: !isDone, status: isDone ? 'todo' : 'done' }),
        })
      } else {
        const isDone = task.status === 'done'
        await fetch(`/api/activities/${task.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: isDone ? 'open' : 'done' }),
        })
      }
      await fetchTasks()
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── LEFT PANEL ──────────────────────────────── */}
      <div className="w-[340px] flex-shrink-0 border-r flex flex-col">
        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b flex-shrink-0">
          {(['all', 'project', 'activity'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 text-[11px] font-medium py-1 rounded-md transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {f === 'all'      && t('inbox.filter.all')}
              {f === 'project'  && t('inbox.filter.project')}
              {f === 'activity' && t('inbox.filter.activity')}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center px-4">
              <Inbox className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t('inbox.empty')}</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Pending */}
              {pending.map(task => (
                <TaskRow
                  key={`${task._taskType}-${task.id}`}
                  task={task}
                  isSelected={selected?.id === task.id && selected?._taskType === task._taskType}
                  isUpdating={updating === task.id}
                  onSelect={() => setSelected(task)}
                  onToggle={() => toggleTask(task)}
                />
              ))}
              {/* Done section */}
              {done.length > 0 && (
                <>
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CheckCheck className="w-3 h-3" />
                      {t('inbox.done_status')} · {done.length}
                    </p>
                  </div>
                  {done.map(task => (
                    <TaskRow
                      key={`${task._taskType}-${task.id}`}
                      task={task}
                      isSelected={selected?.id === task.id && selected?._taskType === task._taskType}
                      isUpdating={updating === task.id}
                      onSelect={() => setSelected(task)}
                      onToggle={() => toggleTask(task)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {!selected ? (
          <EmptyDetail t={t} />
        ) : selected._taskType === 'project' ? (
          <ProjectTaskDetail
            task={selected}
            isUpdating={updating === selected.id}
            onToggle={() => toggleTask(selected)}
            t={t}
          />
        ) : (
          <ActivityTaskDetail
            task={selected}
            isUpdating={updating === selected.id}
            onToggle={() => toggleTask(selected)}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

// ── TaskRow ───────────────────────────────────────────────────────

function TaskRow({
  task, isSelected, isUpdating, onSelect, onToggle,
}: {
  task:       UnifiedTask
  isSelected: boolean
  isUpdating: boolean
  onSelect:   () => void
  onToggle:   () => void
}) {
  const done    = isTaskDone(task)
  const overdue = isOverdue(task)
  const label   = getLabel(task)

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2',
        isSelected
          ? 'bg-muted/60 border-l-primary'
          : 'border-l-transparent hover:bg-muted/30 hover:border-l-muted-foreground/30'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onToggle() }}
        disabled={isUpdating}
        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        aria-label={done ? 'Rouvrir' : 'Terminer'}
      >
        {done
          ? <CheckCircle2 className="w-4 h-4 text-primary" />
          : <Circle className="w-4 h-4" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-snug truncate',
          done && 'line-through text-muted-foreground'
        )}>
          {label}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Source badge */}
          {task._taskType === 'project' ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
              <Folder className="w-2.5 h-2.5" />
              {task._project ? String(task._project.name ?? 'Projet') : 'Tâche'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              <Activity className="w-2.5 h-2.5" />
              {task.related_table ? (TABLE_META[task.related_table]?.label ?? task.related_table) : 'Activité'}
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full',
              overdue
                ? 'text-destructive bg-destructive/10'
                : 'text-muted-foreground bg-muted/60'
            )}>
              {overdue ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              {fmtDate(task.due_date)}
            </span>
          )}

          {/* Priority (project tasks) */}
          {task._taskType === 'project' && task.priority && task.priority !== 'normale' && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              PRIORITY_MAP[task.priority]?.cls ?? 'bg-muted text-muted-foreground'
            )}>
              {PRIORITY_MAP[task.priority]?.label ?? task.priority}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className={cn(
        'w-3.5 h-3.5 flex-shrink-0 mt-1 transition-opacity text-muted-foreground',
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
      )} />
    </div>
  )
}

// ── EmptyDetail ───────────────────────────────────────────────────

function EmptyDetail({ t }: { t: ReturnType<typeof useTranslation> }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Inbox className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{t('inbox.select')}</p>
    </div>
  )
}

// ── ProjectTaskDetail ─────────────────────────────────────────────

function ProjectTaskDetail({
  task, isUpdating, onToggle, t,
}: {
  task:       UnifiedTask
  isUpdating: boolean
  onToggle:   () => void
  t:          ReturnType<typeof useTranslation>
}) {
  const done       = isTaskDone(task)
  const overdue    = isOverdue(task)
  const statusMeta = STATUS_MAP[task.status] ?? null
  const priority   = task.priority ? PRIORITY_MAP[task.priority] : null
  const project    = task._project

  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Folder className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className={cn(
                'text-lg font-semibold leading-tight',
                done && 'line-through text-muted-foreground'
              )}>
                {task.title ?? '—'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tâche projet</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={done ? 'outline' : 'default'}
            onClick={onToggle}
            disabled={isUpdating}
            className="gap-1.5 flex-shrink-0"
          >
            {done ? (
              <><RotateCcw className="w-3.5 h-3.5" />{t('inbox.reopen')}</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5" />{t('inbox.mark_done')}</>
            )}
          </Button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusMeta && (
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          )}
          {priority && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priority.cls)}>
              {priority.label}
            </span>
          )}
          {overdue && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle className="w-3 h-3" />
              {t('inbox.overdue')}
            </span>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow label={t('inbox.due')} value={fmtDate(task.due_date) ?? '—'} />
          <FieldRow label="Statut" value={statusMeta?.label ?? task.status ?? '—'} />
          {task.priority && <FieldRow label="Priorité" value={priority?.label ?? task.priority} />}
          {task.assigned_to && <FieldRow label={t('inbox.assigned_to')} value={`#${task.assigned_to}`} icon={<User className="w-3 h-3" />} />}
        </div>

        {/* Notes */}
        {task.notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
            </div>
          </>
        )}

        {/* Open in tasks */}
        <div>
          <Link
            href={`/dashboard/tasks/${task.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {t('inbox.open')}
          </Link>
        </div>

        {/* Project info card */}
        {project && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                {t('inbox.project_info')}
              </p>
              <ProjectCard project={project} t={t} />
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}

// ── ActivityTaskDetail ────────────────────────────────────────────

function ActivityTaskDetail({
  task, isUpdating, onToggle, t,
}: {
  task:       UnifiedTask
  isUpdating: boolean
  onToggle:   () => void
  t:          ReturnType<typeof useTranslation>
}) {
  const done    = task.status === 'done'
  const overdue = isOverdue(task)
  const meta    = task.related_table ? TABLE_META[task.related_table] : null
  const related = task._related

  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className={cn(
                'text-lg font-semibold leading-tight',
                done && 'line-through text-muted-foreground'
              )}>
                {task.content ?? '—'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Action activité{meta ? ` · ${meta.label}` : ''}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={done ? 'outline' : 'default'}
            onClick={onToggle}
            disabled={isUpdating}
            className="gap-1.5 flex-shrink-0"
          >
            {done ? (
              <><RotateCcw className="w-3.5 h-3.5" />{t('inbox.reopen')}</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5" />{t('inbox.mark_done')}</>
            )}
          </Button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={done ? 'success' : 'info'}>{done ? t('inbox.done_status') : t('inbox.open_status')}</Badge>
          {overdue && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle className="w-3 h-3" />
              {t('inbox.overdue')}
            </span>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow label={t('inbox.due')} value={fmtDate(task.due_date) ?? '—'} />
          {task.assigned_to && <FieldRow label={t('inbox.assigned_to')} value={`#${task.assigned_to}`} icon={<User className="w-3 h-3" />} />}
        </div>

        {/* Related entity card */}
        {related && meta && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {t('inbox.related_info')} · {meta.label}
              </p>
              <RelatedEntityCard
                table={task.related_table!}
                id={task.related_id!}
                record={related}
                meta={meta}
                t={t}
              />
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}

// ── ProjectCard ───────────────────────────────────────────────────

function ProjectCard({
  project, t,
}: {
  project: Record<string, unknown>
  t:       ReturnType<typeof useTranslation>
}) {
  const completion = Number(project.completion ?? 0)
  const statusMeta = STATUS_MAP[String(project.status ?? '')] ?? null

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{String(project.name ?? '—')}</p>
          {Boolean(project.description) && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{String(project.description)}</p>
          )}
        </div>
        {statusMeta && <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Avancement</span>
          <span className="font-medium tabular-nums">{completion}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(completion, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {Boolean(project.due_date) && (
          <FieldRow label={t('inbox.due')} value={fmtDate(String(project.due_date)) ?? '—'} small />
        )}
        {Boolean(project.budget) && (
          <FieldRow
            label="Budget"
            value={Number(project.budget).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            small
          />
        )}
      </div>

      <Link
        href={`/dashboard/projects/${project.id}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        Voir le projet
      </Link>
    </div>
  )
}

// ── RelatedEntityCard ─────────────────────────────────────────────

function RelatedEntityCard({
  table, id, record, meta, t,
}: {
  table:  string
  id:     number
  record: Record<string, unknown>
  meta:   { label: string; path: string; titleField: string }
  t:      ReturnType<typeof useTranslation>
}) {
  const title = String(
    record[meta.titleField] ??
    (table === 'contacts' ? `${record.first_name ?? ''} ${record.last_name ?? ''}`.trim() : null) ??
    `#${id}`
  )

  // Build relevant fields to display based on table type
  const fields: { label: string; value: string }[] = []

  if (table === 'contacts') {
    if (record.email)   fields.push({ label: 'Email',     value: String(record.email) })
    if (record.phone)   fields.push({ label: 'Téléphone', value: String(record.phone) })
    if (record.company) fields.push({ label: 'Société',   value: String(record.company) })
    if (record.role)    fields.push({ label: 'Rôle',      value: String(record.role) })
  } else if (table === 'opportunities') {
    if (record.status)      fields.push({ label: 'Statut',      value: String(record.status) })
    if (record.value)       fields.push({ label: 'Valeur',      value: Number(record.value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) })
    if (record.probability) fields.push({ label: 'Probabilité', value: `${record.probability}%` })
    if (record.close_date)  fields.push({ label: 'Closing',     value: fmtDate(String(record.close_date)) ?? '—' })
  } else if (table === 'contracts') {
    if (record.status)    fields.push({ label: 'Statut',    value: String(record.status) })
    if (record.value)     fields.push({ label: 'Valeur',    value: Number(record.value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) })
    if (record.end_date)  fields.push({ label: 'Expiration', value: fmtDate(String(record.end_date)) ?? '—' })
  } else if (table === 'projects') {
    if (record.status)     fields.push({ label: 'Statut',      value: String(record.status) })
    if (record.completion) fields.push({ label: 'Avancement',  value: `${record.completion}%` })
    if (record.due_date)   fields.push({ label: t('inbox.due'), value: fmtDate(String(record.due_date)) ?? '—' })
  } else if (table === 'tasks') {
    if (record.status)   fields.push({ label: 'Statut',   value: String(record.status) })
    if (record.priority) fields.push({ label: 'Priorité', value: String(record.priority) })
    if (record.due_date) fields.push({ label: t('inbox.due'), value: fmtDate(String(record.due_date)) ?? '—' })
  } else if (table === 'invoices') {
    if (record.status)      fields.push({ label: 'Statut', value: String(record.status) })
    if (record.total)       fields.push({ label: 'Total',  value: Number(record.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) })
    if (record.due_date)    fields.push({ label: t('inbox.due'), value: fmtDate(String(record.due_date)) ?? '—' })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm">{title}</p>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{meta.label}</span>
      </div>

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {fields.map(f => (
            <FieldRow key={f.label} label={f.label} value={f.value} small />
          ))}
        </div>
      )}

      <Link
        href={`${meta.path}/${id}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        Voir {meta.label.toLowerCase()}
      </Link>
    </div>
  )
}

// ── FieldRow ──────────────────────────────────────────────────────

function FieldRow({
  label, value, icon, small,
}: {
  label:  string
  value:  string
  icon?:  React.ReactNode
  small?: boolean
}) {
  return (
    <div>
      <p className={cn('font-medium text-muted-foreground', small ? 'text-[10px]' : 'text-xs')}>{label}</p>
      <p className={cn('text-foreground flex items-center gap-1 mt-0.5', small ? 'text-xs' : 'text-sm')}>
        {icon}
        {value || '—'}
      </p>
    </div>
  )
}
