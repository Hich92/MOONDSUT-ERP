'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  StickyNote, ListTodo, History,
  Plus, X, Check, Clock, User,
  RotateCcw, Ban, ChevronDown, ChevronUp,
  Pencil, AlertTriangle,
} from 'lucide-react'
import { Textarea }  from '@/components/ui/textarea'
import { Input }     from '@/components/ui/input'
import { Button }    from '@/components/ui/button'
import { cn }        from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'
import { usePreferences } from '@/components/providers/PreferencesProvider'
import { getDateLocale }  from '@/lib/i18n'

// ── Types ─────────────────────────────────────────────────────────

type ActivityStatus = 'open' | 'done' | 'cancelled'

interface Activity {
  id:             number
  type:           'Note' | 'Action'
  content:        string
  status:         ActivityStatus
  due_date?:      string
  resolved_at?:   string
  related_table?: string
  related_id?:    number
  assigned_to?:   number
  created_at?:    string
}

interface HistoryEntry {
  _version:            number
  _time:               string | null
  _userid:             number | null
  _restore_of_version: number | null
  [key: string]:       unknown
}

interface UserItem { id: number; email: string }

interface ActivitiesPanelProps {
  relatedTable?: string
  relatedId?:    number
}

type TimelineItem =
  | { kind: 'activity'; ts: string; data: Activity }
  | { kind: 'history';  ts: string; data: HistoryEntry }

type CreateMode = 'none' | 'note' | 'action'

// ── Helpers ───────────────────────────────────────────────────────

const META_FIELDS = new Set(['_version', '_time', '_userid', '_restore_of_version', 'id'])

function fmtDate(d: string | null | undefined, dateLocale: string): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

function fmtDateTime(d: string | null | undefined, dateLocale: string): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString(dateLocale, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return d }
}

function formatValue(v: unknown, dateLocale: string): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return fmtDate(v, dateLocale)
  return String(v)
}

function getChangedFields(cur: HistoryEntry, prev: HistoryEntry | undefined) {
  if (!prev) return null
  const changes: { key: string; from: unknown; to: unknown }[] = []
  for (const key of Object.keys(cur)) {
    if (META_FIELDS.has(key)) continue
    if (String(cur[key] ?? '') !== String(prev[key] ?? ''))
      changes.push({ key, from: prev[key], to: cur[key] })
  }
  return changes
}

// ── Component ─────────────────────────────────────────────────────

export function ActivitiesPanel({ relatedTable, relatedId }: ActivitiesPanelProps) {
  const t          = useTranslation()
  const { prefs }  = usePreferences()
  const dateLocale = getDateLocale(prefs.language)

  const [activities,  setActivities]  = useState<Activity[]>([])
  const [history,     setHistory]     = useState<HistoryEntry[]>([])
  const [loadingAct,  setLoadingAct]  = useState(false)
  const [loadingHist, setLoadingHist] = useState(false)
  const [users,       setUsers]       = useState<UserItem[]>([])
  const [createMode,  setCreateMode]  = useState<CreateMode>('none')

  // Note form
  const [noteText, setNoteText] = useState('')
  // Action form
  const [actionText,     setActionText]     = useState('')
  const [actionDate,     setActionDate]     = useState('')
  const [actionAssignee, setActionAssignee] = useState('')

  const currentUserId = typeof document !== 'undefined'
    ? (() => { const m = document.cookie.match(/sc_user_id=(\d+)/); return m ? m[1] : '' })()
    : ''

  // ── Fetch ──────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    setLoadingAct(true)
    try {
      const qs = new URLSearchParams()
      if (relatedTable) qs.set('table', relatedTable)
      if (relatedId)    qs.set('id', String(relatedId))
      const res  = await fetch(`/api/activities?${qs}`)
      const data = await res.json()
      if (data.success) setActivities(data.data ?? [])
    } catch { /* ignore */ }
    finally { setLoadingAct(false) }
  }, [relatedTable, relatedId])

  const fetchHistory = useCallback(async () => {
    if (!relatedTable || !relatedId) return
    setLoadingHist(true)
    try {
      const res  = await fetch(`/api/history/${relatedTable}/${relatedId}`)
      const data = await res.json()
      if (!data.error) setHistory(data.data ?? [])
    } catch { /* ignore */ }
    finally { setLoadingHist(false) }
  }, [relatedTable, relatedId])

  useEffect(() => {
    fetchActivities()
    fetchHistory()
  }, [fetchActivities, fetchHistory])

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      const list: UserItem[] = data.data ?? []
      setUsers(list)
      setActionAssignee(currentUserId)
    }).catch(() => {})
  }, [currentUserId])

  // ── Create ─────────────────────────────────────────────────────

  async function createNote() {
    if (!noteText.trim()) return
    const body: Record<string, unknown> = { type: 'Note', content: noteText.trim(), status: 'open' }
    if (relatedTable) body.related_table = relatedTable
    if (relatedId)    body.related_id    = relatedId
    const res = await fetch('/api/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { setNoteText(''); setCreateMode('none'); fetchActivities() }
  }

  async function createAction() {
    if (!actionText.trim()) return
    const body: Record<string, unknown> = { type: 'Action', content: actionText.trim(), status: 'open' }
    if (relatedTable)           body.related_table = relatedTable
    if (relatedId)              body.related_id    = relatedId
    if (actionDate)             body.due_date      = actionDate
    if (actionAssignee)         body.assigned_to   = Number(actionAssignee)
    const res = await fetch('/api/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { setActionText(''); setActionDate(''); setCreateMode('none'); fetchActivities() }
  }

  // ── Update status ──────────────────────────────────────────────

  async function setStatus(id: number, status: ActivityStatus) {
    await fetch(`/api/activities/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchActivities()
  }

  async function remove(id: number) {
    await fetch(`/api/activities/${id}`, { method: 'DELETE' })
    fetchActivities()
  }

  // ── Build timeline ─────────────────────────────────────────────

  const timeline: TimelineItem[] = [
    ...activities.map(a => ({
      kind: 'activity' as const,
      ts:   a.created_at ?? '1970-01-01',
      data: a,
    })),
    ...history.map(h => ({
      kind: 'history' as const,
      ts:   h._time ?? '1970-01-01',
      data: h,
    })),
  ].sort((a, b) => b.ts.localeCompare(a.ts))

  const loading = loadingAct || loadingHist

  // ── Render ─────────────────────────────────────────────────────

  return (
    <aside className="act-panel h-full">
      <div className="act-panel-header">
        <span className="act-panel-title">{t('activities.title')}</span>
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Quick-add bar ───────────────────────────────────── */}
        <div className="flex gap-2 px-3 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={() => setCreateMode(m => m === 'note' ? 'none' : 'note')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors',
              createMode === 'note'
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                : 'border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50'
            )}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Note
            {createMode === 'note' ? <ChevronUp className="w-3 h-3 ml-auto" /> : <Plus className="w-3 h-3 ml-auto" />}
          </button>
          <button
            onClick={() => setCreateMode(m => m === 'action' ? 'none' : 'action')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors',
              createMode === 'action'
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5'
            )}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Action
            {createMode === 'action' ? <ChevronUp className="w-3 h-3 ml-auto" /> : <Plus className="w-3 h-3 ml-auto" />}
          </button>
        </div>

        {/* ── Inline note form ────────────────────────────────── */}
        {createMode === 'note' && (
          <div className="px-3 pb-3 flex-shrink-0 flex flex-col gap-2 border-b">
            <Textarea
              autoFocus
              placeholder="Ajouter une note…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="text-xs min-h-[72px] bg-muted/30 resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) createNote() }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={createNote} disabled={!noteText.trim()} className="flex-1 h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setNoteText(''); setCreateMode('none') }} className="h-7 text-xs px-2">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Inline action form ───────────────────────────────── */}
        {createMode === 'action' && (
          <div className="px-3 pb-3 flex-shrink-0 flex flex-col gap-1.5 border-b">
            <Input
              autoFocus
              placeholder="Décrire l'action…"
              value={actionText}
              onChange={e => setActionText(e.target.value)}
              className="text-xs h-8 bg-muted/30"
              onKeyDown={e => { if (e.key === 'Enter') createAction() }}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="date" value={actionDate}
                onChange={e => setActionDate(e.target.value)}
                className="text-xs h-8 bg-muted/30"
              />
              {users.length > 0 && (
                <select
                  value={actionAssignee}
                  onChange={e => setActionAssignee(e.target.value)}
                  className="h-8 px-2 text-xs rounded-md border border-input bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Non assigné</option>
                  {users.map(u => (
                    <option key={u.id} value={String(u.id)}>
                      {u.id === Number(currentUserId) ? `${u.email} (moi)` : u.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createAction} disabled={!actionText.trim()} className="flex-1 h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setActionText(''); setActionDate(''); setCreateMode('none') }} className="h-7 text-xs px-2">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Timeline ─────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          {loading && timeline.length === 0 ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <History className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Aucune activité</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />
              <div className="space-y-1 pl-6">
                {timeline.map((item, idx) =>
                  item.kind === 'activity' ? (
                    <ActivityEntry
                      key={`act-${item.data.id}`}
                      activity={item.data}
                      dateLocale={dateLocale}
                      users={users}
                      onSetStatus={setStatus}
                      onRemove={remove}
                    />
                  ) : (
                    <HistoryEntry
                      key={`hist-${item.data._version}`}
                      entry={item.data}
                      isCreation={idx === timeline.length - 1 || item.data._version === 1}
                      dateLocale={dateLocale}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ── ActivityEntry ─────────────────────────────────────────────────

function ActivityEntry({
  activity, dateLocale, users, onSetStatus, onRemove,
}: {
  activity:    Activity
  dateLocale:  string
  users:       UserItem[]
  onSetStatus: (id: number, s: ActivityStatus) => void
  onRemove:    (id: number) => void
}) {
  const isNote      = activity.type === 'Note'
  const isDone      = activity.status === 'done'
  const isCancelled = activity.status === 'cancelled'
  const isOpen      = activity.status === 'open'
  const overdue     = isOpen && activity.due_date && activity.due_date < new Date().toISOString().slice(0, 10)
  const assignee    = users.find(u => u.id === activity.assigned_to)

  return (
    <div className="group relative mb-2">
      {/* Dot */}
      <div className={cn(
        'absolute -left-[22px] top-3 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center flex-shrink-0',
        isNote      ? 'bg-amber-400'     :
        isDone      ? 'bg-green-500'     :
        isCancelled ? 'bg-muted-foreground/40' :
                      'bg-primary'
      )}>
        {isNote
          ? <StickyNote className="w-2 h-2 text-white" />
          : isDone
            ? <Check className="w-2 h-2 text-white" />
            : isCancelled
              ? <Ban className="w-2 h-2 text-white/70" />
              : <ListTodo className="w-2 h-2 text-white" />
        }
      </div>

      {/* Card */}
      <div className={cn(
        'rounded-lg border transition-colors',
        isNote
          ? 'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10'
          : isDone
            ? 'border-green-200/50 bg-green-50/30 dark:border-green-900/20 dark:bg-green-950/10 opacity-70'
            : isCancelled
              ? 'border-border/30 bg-muted/20 opacity-50'
              : 'border-border/60 bg-card'
      )}>
        <div className="px-3 py-2.5">
          {/* Type badge */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5',
              isNote
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : isDone
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : isCancelled
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary'
            )}>
              {isNote ? <StickyNote className="w-2.5 h-2.5" /> : <ListTodo className="w-2.5 h-2.5" />}
              {isNote ? 'Note' : 'Action'}
              {isDone && ' · Fait'}
              {isCancelled && ' · Annulé'}
            </span>

            {/* Delete */}
            <button
              onClick={() => onRemove(activity.id)}
              className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Content */}
          <p className={cn(
            'text-sm leading-relaxed break-words',
            (isDone || isCancelled) && 'line-through text-muted-foreground'
          )}>
            {activity.content}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {activity.created_at && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {fmtDateTime(activity.created_at, dateLocale)}
              </span>
            )}
            {activity.due_date && isOpen && (
              <span className={cn(
                'text-[10px] flex items-center gap-1 font-medium',
                overdue ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {overdue ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                Échéance {fmtDate(activity.due_date, dateLocale)}
                {overdue && ' · En retard'}
              </span>
            )}
            {activity.resolved_at && !isOpen && (
              <span className={cn(
                'text-[10px] flex items-center gap-1 font-medium',
                isDone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}>
                <Check className="w-2.5 h-2.5" />
                {isDone ? 'Terminée' : 'Annulée'} le {fmtDate(activity.resolved_at, dateLocale)}
              </span>
            )}
            {assignee && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {assignee.email.split('@')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons — only for open Actions */}
        {!isNote && isOpen && (
          <div className="flex gap-1.5 px-3 py-2 border-t border-border/30">
            <button
              onClick={() => onSetStatus(activity.id, 'done')}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 bg-green-500/10 text-green-700 hover:bg-green-500/20 transition-colors dark:text-green-400"
            >
              <Check className="w-3 h-3" /> Fait
            </button>
            <button
              onClick={() => onSetStatus(activity.id, 'cancelled')}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Ban className="w-3 h-3" /> Annuler
            </button>
          </div>
        )}

        {/* Reopen for done/cancelled */}
        {!isNote && !isOpen && (
          <div className="px-3 py-2 border-t border-border/20">
            <button
              onClick={() => onSetStatus(activity.id, 'open')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Rouvrir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── HistoryEntry ──────────────────────────────────────────────────

function HistoryEntry({
  entry, isCreation, dateLocale,
}: {
  entry:      HistoryEntry
  isCreation: boolean
  dateLocale: string
}) {
  const [expanded, setExpanded] = useState(false)

  const changes = isCreation ? null : (() => {
    // We don't have prev here — just show "modified"
    return null
  })()

  const label = isCreation
    ? 'Création'
    : entry._restore_of_version
      ? `Restauré (v${entry._restore_of_version})`
      : 'Modification'

  return (
    <div className="group relative mb-2">
      {/* Dot */}
      <div className={cn(
        'absolute -left-[22px] top-3 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
        isCreation ? 'bg-primary/80' : 'bg-muted-foreground/30'
      )}>
        <History className="w-2 h-2 text-white" />
      </div>

      {/* Card */}
      <div
        className={cn(
          'rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5 transition-colors',
          'cursor-pointer hover:border-border/60 hover:bg-muted/20'
        )}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 flex-shrink-0',
              isCreation
                ? 'bg-primary/15 text-primary'
                : entry._restore_of_version
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-muted text-muted-foreground'
            )}>
              {label}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">v{entry._version}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {entry._userid && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" />#{entry._userid}
              </span>
            )}
            {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
          </div>
        </div>

        {entry._time && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {fmtDateTime(entry._time, dateLocale)}
          </p>
        )}

        {expanded && (
          <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
            {Object.entries(entry)
              .filter(([k, v]) => !META_FIELDS.has(k) && v !== null && v !== '')
              .map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[10px]">
                  <span className="font-medium text-muted-foreground w-20 truncate flex-shrink-0">{k}</span>
                  <span className="text-foreground/80 truncate">{formatValue(v, dateLocale)}</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
