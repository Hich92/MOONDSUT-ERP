'use client'

import Link from 'next/link'
import { DataTable } from './DataTable'
import type { ColDef } from './DataTable'
import { useTranslation } from '@/hooks/use-translation'

interface ViewBodyProps {
  data:            Record<string, unknown>[]
  columns:         ColDef[]
  detailBasePath?: string
  newHref?:        string
  newLabel?:       string
  apiTable?:       string
  emptyTitle:      string
}

function EmptyState({ title, newHref, newLabel }: {
  title:     string
  newHref?:  string
  newLabel?: string
}) {
  const t = useTranslation()
  const btnLabel = newLabel ?? t('common.new')
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <span className="text-2xl text-primary/50">∅</span>
      </div>
      <p className="text-sm font-semibold">{t('view.no_records')}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        {t('view.no_items')} <strong>{title}</strong> {t('view.yet')}
      </p>
      {newHref && (
        <Link
          href={newHref}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors"
        >
          + {btnLabel}
        </Link>
      )}
    </div>
  )
}

export function ViewBody({
  data, columns, detailBasePath, newHref, newLabel, apiTable, emptyTitle,
}: ViewBodyProps) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} newHref={newHref} newLabel={newLabel} />
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      detailBasePath={detailBasePath}
      newHref={newHref}
      newLabel={newLabel}
      apiTable={apiTable}
    />
  )
}
