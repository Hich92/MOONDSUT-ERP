import React         from 'react'
import Link          from 'next/link'
import { Home, ChevronRight, type LucideIcon } from 'lucide-react'
import { ViewBody }  from './ViewBody'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export type { ColDef } from './DataTable'

interface PageListProps {
  title:           string
  subtitle:        string
  icon:            LucideIcon
  iconColor?:      string
  iconBg?:         string
  newHref?:        string
  newLabel?:       string
  detailBasePath?: string
  apiTable?:       string
  columns:         import('./DataTable').ColDef[]
  data:            Record<string, unknown>[]
  error?:          string | null
  topSlot?:        React.ReactNode
}

export function PageList({
  title, subtitle, icon: Icon,
  newHref, newLabel,
  detailBasePath, apiTable,
  columns, data, error, topSlot,
}: PageListProps) {
  const t      = getT(getLocale())
  const btnNew = newLabel ?? t('common.new')

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <div className="brand-icon">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="page-heading truncate">{title}</h1>
            <nav className="breadcrumb">
              <Link href="/dashboard" className="breadcrumb-link">
                <Home className="w-3 h-3" /><span>{t('list.home')}</span>
              </Link>
              <ChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{title}</span>
            </nav>
          </div>
        </div>
        <p className="text-xs text-muted-foreground hidden md:block">{subtitle}</p>
      </header>

      {/* ── Top slot (filtres, onglets…) ─────────────────────────── */}
      {topSlot && <div className="px-6 pt-4">{topSlot}</div>}

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 p-6">
        {error ? (
          <ErrorState error={error} label={t('list.unavailable')} />
        ) : (
          <ViewBody
            data={data}
            columns={columns}
            detailBasePath={detailBasePath}
            newHref={newHref}
            newLabel={btnNew}
            apiTable={apiTable}
            emptyTitle={title}
          />
        )}
      </div>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────
function ErrorState({ error, label }: { error: string; label: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 max-w-lg">
      <p className="text-sm font-semibold text-amber-800 mb-1">{label}</p>
      <p className="text-xs text-amber-700">
        Saltcorn: <code className="bg-amber-100 px-1 rounded">{error}</code>
      </p>
    </div>
  )
}
