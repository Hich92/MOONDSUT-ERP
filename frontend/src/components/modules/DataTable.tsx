'use client'
import React, {
  useState, useMemo, useEffect, useRef,
} from 'react'
import Link        from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, Download,
  ArrowUpDown, ArrowUp, ArrowDown,
  Columns3, Layers, ChevronDown, ChevronRight as CR,
  AlertTriangle, X, Paperclip,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn }       from '@/lib/utils'
import {
  renderStage, renderContractStatus, renderProjectStatus,
  renderTaskStatus, renderContactType, renderPartnerType,
  renderSupplierContractStatus, renderPurchaseOrderStatus, renderSupplierInvoiceStatus,
  renderAmount, renderPercent, renderBool, renderDate,
} from './renderers'
import { useTranslation } from '@/hooks/use-translation'

// ── Renderer registry ────────────────────────────────────────────
const RENDERERS: Record<string, (v: unknown) => React.ReactNode> = {
  stage:          renderStage,
  contractStatus: renderContractStatus,
  projectStatus:  renderProjectStatus,
  taskStatus:              renderTaskStatus,
  contactType:             renderContactType,
  partnerType:             renderPartnerType,
  supplierContractStatus:  renderSupplierContractStatus,
  purchaseOrderStatus:     renderPurchaseOrderStatus,
  supplierInvoiceStatus:   renderSupplierInvoiceStatus,
  amount:                  renderAmount,
  percent:        renderPercent,
  bool:           renderBool,
  date:           renderDate,
}

// ── Types ────────────────────────────────────────────────────────
export interface ColDef {
  key:      string
  label:    string
  renderAs?: keyof typeof RENDERERS
}

type SortDir = 'asc' | 'desc' | null

const PAGE_SIZES = [10, 25, 50, 100]

function humanLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface DataTableProps {
  columns:         ColDef[]
  data:            Record<string, unknown>[]
  detailBasePath?: string
  newHref?:        string
  newLabel?:       string
  apiTable?:       string
}

// ════════════════════════════════════════════════════════════════
export function DataTable({
  columns, data,
  detailBasePath, newHref, newLabel, apiTable,
}: DataTableProps) {
  const router = useRouter()
  const t      = useTranslation()
  const btnNew = newLabel ?? t('common.new')

  // All columns (default + auto-detected)
  const allCols = useMemo<ColDef[]>(() => {
    const defined = new Map(columns.map(c => [c.key, c]))
    const extraKeys = data.length > 0
      ? Object.keys(data[0]).filter(k => !defined.has(k))
      : []
    return [
      ...columns,
      ...extraKeys.map(k => ({ key: k, label: humanLabel(k) })),
    ]
  }, [columns, data])

  // ── State ─────────────────────────────────────────────────────
  const [visibleKeys,  setVisibleKeys]  = useState<Set<string>>(() => new Set(columns.map(c => c.key)))
  const [search,       setSearch]       = useState('')
  const [sortKey,      setSortKey]      = useState<string | null>(null)
  const [sortDir,      setSortDir]      = useState<SortDir>(null)
  const [groupBy,      setGroupBy]      = useState<string | null>(null)
  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set())
  const [selected,     setSelected]     = useState<Set<number>>(new Set())
  const [pageSize,     setPageSize]     = useState(25)
  const [page,         setPage]         = useState(1)
  const [colOpen,      setColOpen]      = useState(false)
  const [groupOpen,    setGroupOpen]    = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState<string | null>(null)

  const colRef   = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colRef.current   && !colRef.current.contains(e.target as Node))   setColOpen(false)
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const visibleCols = useMemo(
    () => allCols.filter(c => visibleKeys.has(c.key)),
    [allCols, visibleKeys]
  )

  // ── Pipeline: filter → sort → (group | paginate) ─────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(row =>
      allCols.some(c => {
        const v = row[c.key]
        return v != null && String(v).toLowerCase().includes(q)
      })
    )
  }, [data, search, allCols])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: 'base', numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const groups = useMemo(() => {
    if (!groupBy) return null
    const map = new Map<string, Record<string, unknown>[]>()
    for (const row of sorted) {
      const k = String(row[groupBy] ?? '—')
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(row)
    }
    return map
  }, [sorted, groupBy])

  const totalPages = groups ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize))
  const cur        = Math.min(page, totalPages)
  const pageSlice  = groups ? sorted : sorted.slice((cur - 1) * pageSize, cur * pageSize)

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handlePageSize(v: number) { setPageSize(v); setPage(1) }

  function handleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir(null) }
  }

  // ── Selection ─────────────────────────────────────────────────
  const allPageIds   = pageSlice.map(r => Number(r.id)).filter(Boolean)
  const allSelected  = allPageIds.length > 0 && allPageIds.every(id => selected.has(id))
  const someSelected = allPageIds.some(id => selected.has(id)) && !allSelected

  function toggleAll() {
    if (allSelected) setSelected(prev => { const s = new Set(prev); allPageIds.forEach(id => s.delete(id)); return s })
    else setSelected(prev => new Set([...prev, ...allPageIds]))
  }

  function toggleRow(id: number) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  // ── Delete ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!apiTable || selected.size === 0) return
    setDeleting(true)
    setDeleteError(null)
    const errors: string[] = []

    for (const id of [...selected]) {
      const res = await fetch(`/api/records/${apiTable}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        errors.push(body.error ?? `Error #${id}`)
      }
    }

    setDeleting(false)
    if (errors.length) {
      setDeleteError(errors.join(' · '))
    } else {
      setSelected(new Set())
      setConfirmDel(false)
      router.refresh()
    }
  }

  // ── Export CSV ────────────────────────────────────────────────
  function handleExport() {
    const header = visibleCols.map(c => `"${c.label}"`).join(',')
    const lines  = sorted.map(row =>
      visibleCols.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `${apiTable ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleGroup(key: string) {
    setCollapsed(prev => {
      const s = new Set(prev)
      s.has(key) ? s.delete(key) : s.add(key)
      return s
    })
  }

  const nSel = selected.size

  // ════════════════════════════════════════════════════════════════
  return (
    <div className="dt-root">

      {/* ── Toolbar (sticky) ──────────────────────────────────── */}
      <div className="dt-toolbar">

        {/* Left actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {nSel > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
              {nSel} sel.
            </span>
          )}

          {newHref && (
            <Button size="sm" className="action-btn-primary h-8" asChild>
              <Link href={newHref}>
                <Plus className="w-3.5 h-3.5" />{btnNew}
              </Link>
            </Button>
          )}

          {detailBasePath && (
            <Button
              size="sm" variant="outline"
              className={cn('action-btn-secondary h-8', nSel !== 1 && 'opacity-40 cursor-not-allowed')}
              disabled={nSel !== 1}
              asChild={nSel === 1}
            >
              {nSel === 1
                ? <Link href={`${detailBasePath}/${[...selected][0]}`}>
                    <Pencil className="w-3.5 h-3.5 text-primary" />{t('common.edit')}
                  </Link>
                : <span className="flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />{t('common.edit')}
                  </span>
              }
            </Button>
          )}

          {apiTable && (
            <Button
              size="sm" variant="outline"
              className={cn(
                'action-btn-secondary h-8',
                nSel === 0 && 'opacity-40 cursor-not-allowed',
                nSel > 0   && 'border-destructive/40 text-destructive hover:bg-destructive/10'
              )}
              disabled={nSel === 0 || deleting}
              onClick={() => { setConfirmDel(true); setDeleteError(null) }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('table.delete')}{nSel > 1 ? ` (${nSel})` : ''}
            </Button>
          )}

          <Button size="sm" variant="outline" className="action-btn-secondary h-8" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 text-primary" />CSV
          </Button>
        </div>

        {/* Search */}
        <div className="dt-search">
          <Search className="dt-search-icon" />
          <input
            type="text" placeholder={t('table.search')}
            value={search} onChange={e => handleSearch(e.target.value)}
            className="dt-search-input"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Columns */}
          <div className="relative" ref={colRef}>
            <Button
              size="sm" variant="outline" className="action-btn-secondary h-8 gap-1"
              onClick={() => { setColOpen(v => !v); setGroupOpen(false) }}
            >
              <Columns3 className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">{t('table.columns')}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {visibleKeys.size}/{allCols.length}
              </span>
            </Button>
            {colOpen && (
              <div className="dt-dropdown w-52">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
                  {t('table.columns')}
                </p>
                <div className="overflow-y-auto max-h-64">
                  {allCols.map(c => (
                    <label key={c.key} className="dt-dropdown-item cursor-pointer">
                      <Checkbox
                        checked={visibleKeys.has(c.key)}
                        onCheckedChange={checked => {
                          setVisibleKeys(prev => {
                            const s = new Set(prev)
                            checked ? s.add(c.key) : s.delete(c.key)
                            return s
                          })
                        }}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-xs truncate">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group by */}
          <div className="relative" ref={groupRef}>
            <Button
              size="sm" variant="outline"
              className={cn('action-btn-secondary h-8 gap-1', groupBy && 'border-primary text-primary')}
              onClick={() => { setGroupOpen(v => !v); setColOpen(false) }}
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">
                {groupBy ? `${t('table.grouped')}: ${humanLabel(groupBy)}` : t('table.group_by')}
              </span>
            </Button>
            {groupOpen && (
              <div className="dt-dropdown w-48">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
                  {t('table.group_by')}
                </p>
                <button
                  className={cn('dt-dropdown-item text-xs', !groupBy && 'opacity-40')}
                  onClick={() => { setGroupBy(null); setGroupOpen(false); setCollapsed(new Set()) }}
                >
                  <X className="w-3 h-3" /><span>{t('table.no_group')}</span>
                </button>
                {allCols.map(c => (
                  <button
                    key={c.key}
                    className={cn('dt-dropdown-item text-xs', groupBy === c.key && 'bg-primary/10 text-primary font-medium')}
                    onClick={() => { setGroupBy(c.key); setGroupOpen(false); setCollapsed(new Set()) }}
                  >
                    <span className="w-3">{groupBy === c.key ? '✓' : ''}</span>
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Page size */}
          <label className="dt-size-label">
            <select
              value={pageSize}
              onChange={e => handlePageSize(Number(e.target.value))}
              className="dt-size-select"
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n} {t('table.rows')}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* ── Result count ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted/5 border-b text-xs text-muted-foreground">
        <span>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && data.length !== filtered.length && ` ${t('table.of')} ${data.length}`}
          {groupBy && ` · ${groups?.size ?? 0} group${(groups?.size ?? 0) !== 1 ? 's' : ''}`}
        </span>
        {nSel > 0 && (
          <button className="text-xs underline hover:text-foreground" onClick={() => setSelected(new Set())}>
            {t('table.deselect_all')}
          </button>
        )}
      </div>

      {/* ── Delete confirmation ────────────────────────────────── */}
      {confirmDel && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-destructive/5 border-b border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive flex-1">
            {t('table.confirm_delete')} <strong>{nSel}</strong> {t('table.record')}
            {deleteError && <span className="ml-2 font-normal">{deleteError}</span>}
          </p>
          <Button size="sm" variant="outline"
            className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={handleDelete} disabled={deleting}>
            {deleting ? t('table.deleting') : t('table.confirm')}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => { setConfirmDel(false); setDeleteError(null) }}>
            {t('table.cancel')}
          </Button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        {(groupBy ? sorted : pageSlice).length === 0 ? (
          <EmptyRows search={search} />
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-10 pl-4 pr-2">
                  <IndeterminateCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                </th>
                {visibleCols.map(c => (
                  <th key={c.key}>
                    <button
                      className="flex items-center gap-1.5 group hover:text-foreground w-full text-left"
                      onClick={() => handleSort(c.key)}
                    >
                      <span>{c.label}</span>
                      <SortIcon col={c.key} sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                ))}
                {detailBasePath && <th className="w-10 text-right pr-4" />}
              </tr>
            </thead>
            <tbody>
              {groupBy && groups
                ? [...groups.entries()].map(([gKey, gRows]) => (
                    <React.Fragment key={gKey}>
                      <tr className="dt-group-row" onClick={() => toggleGroup(gKey)}>
                        <td colSpan={visibleCols.length + 2} className="dt-group-cell">
                          <button className="flex items-center gap-2">
                            {collapsed.has(gKey)
                              ? <CR className="w-3.5 h-3.5 text-primary" />
                              : <ChevronDown className="w-3.5 h-3.5 text-primary" />}
                            <span className="font-semibold text-xs">
                              {humanLabel(groupBy)}&nbsp;:&nbsp;
                              <span className="text-foreground">{gKey}</span>
                            </span>
                            <span className="ml-1 text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0">
                              {gRows.length}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {!collapsed.has(gKey) && gRows.map((row, i) => (
                        <DataRow
                          key={String(row.id ?? i)}
                          row={row} cols={visibleCols}
                          selected={selected} onToggle={toggleRow}
                          detailBasePath={detailBasePath}
                        />
                      ))}
                    </React.Fragment>
                  ))
                : pageSlice.map((row, i) => (
                    <DataRow
                      key={String(row.id ?? i)}
                      row={row} cols={visibleCols}
                      selected={selected} onToggle={toggleRow}
                      detailBasePath={detailBasePath}
                    />
                  ))
              }
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {!groupBy && (
        <div className="dt-footer">
          <span className="dt-range">
            {sorted.length > 0
              ? `${(cur-1)*pageSize+1}–${Math.min(cur*pageSize, sorted.length)} ${t('table.of')} ${sorted.length}`
              : `0 results`}
          </span>
          {totalPages > 1 && (
            <div className="dt-pages">
              <Button variant="ghost" size="sm" className="dt-page-btn"
                disabled={cur === 1} onClick={() => setPage(cur - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {pageNums(cur, totalPages).map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} className="text-xs px-1 text-muted-foreground">…</span>
                  : <Button key={n} variant="ghost" size="sm"
                      className={cn('dt-page-btn text-xs', cur === n && 'dt-page-active')}
                      onClick={() => setPage(n as number)}>{n}</Button>
              )}
              <Button variant="ghost" size="sm" className="dt-page-btn"
                disabled={cur === totalPages} onClick={() => setPage(cur + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function DataRow({
  row, cols, selected, onToggle, detailBasePath,
}: {
  row:             Record<string, unknown>
  cols:            ColDef[]
  selected:        Set<number>
  onToggle:        (id: number) => void
  detailBasePath?: string
}) {
  const id         = Number(row.id)
  const isSelected = selected.has(id)

  return (
    <tr className={cn(isSelected && 'bg-primary/5 border-l-2 border-l-primary')}>
      <td className="w-10 pl-4 pr-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(id)}
          className="w-3.5 h-3.5"
        />
      </td>
      {cols.map((c, j) => {
        const fn = c.renderAs ? RENDERERS[c.renderAs] : undefined
        return (
          <td key={c.key} className={j === 0 ? 'font-medium' : ''}>
            {fn ? fn(row[c.key]) : row[c.key] != null ? String(row[c.key]) : '—'}
          </td>
        )
      })}
      {detailBasePath && (
        <td className="text-right pr-3">
          <Button variant="ghost" size="sm"
            className="h-7 w-7 p-0 text-primary hover:bg-primary/10" asChild>
            <Link href={`${detailBasePath}/${id}`} aria-label="Open">
              <CR className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </td>
      )}
    </tr>
  )
}

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-60 flex-shrink-0" />
  if (sortDir === 'asc')  return <ArrowUp   className="w-3 h-3 text-primary flex-shrink-0" />
  return <ArrowDown className="w-3 h-3 text-primary flex-shrink-0" />
}

function IndeterminateCheckbox({
  checked, indeterminate, onChange,
}: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  return (
    <Checkbox
      checked={indeterminate ? 'indeterminate' : checked}
      onCheckedChange={onChange}
      className="w-3.5 h-3.5"
      aria-label="Select all"
    />
  )
}

function EmptyRows({ search }: { search: string }) {
  const t = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Search className="w-8 h-8 text-muted-foreground/25 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{t('table.no_results')}</p>
      {search && (
        <p className="text-xs text-muted-foreground/60 mt-1">
          {t('table.no_match')} « {search} »
        </p>
      )}
    </div>
  )
}

function pageNums(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)   return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total]
  return [1, '…', cur-1, cur, cur+1, '…', total]
}
