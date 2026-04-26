import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import type { ColDef } from './DataTable'
import {
  renderStage, renderContractStatus, renderProjectStatus,
  renderTaskStatus, renderContactType, renderPartnerType,
  renderSupplierContractStatus, renderPurchaseOrderStatus, renderSupplierInvoiceStatus,
  renderAmount, renderPercent, renderBool, renderDate,
} from './renderers'

const RENDERERS: Record<string, (v: unknown) => React.ReactNode> = {
  stage: renderStage, contractStatus: renderContractStatus,
  projectStatus: renderProjectStatus, taskStatus: renderTaskStatus,
  contactType: renderContactType, partnerType: renderPartnerType,
  supplierContractStatus: renderSupplierContractStatus,
  purchaseOrderStatus: renderPurchaseOrderStatus,
  supplierInvoiceStatus: renderSupplierInvoiceStatus,
  amount: renderAmount, percent: renderPercent, bool: renderBool, date: renderDate,
}

interface RelatedListProps {
  title:           string
  items:           Record<string, unknown>[]
  columns:         ColDef[]
  detailBasePath:  string
  newHref:         string
  newLabel:        string
  emptyMessage?:   string
}

export function RelatedList({
  title, items, columns, detailBasePath,
  newHref, newLabel, emptyMessage,
}: RelatedListProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <Link
          href={newHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3 w-3" />{newLabel}
        </Link>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          {emptyMessage ?? 'Aucun enregistrement lié.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/10">
                {columns.map(c => (
                  <th key={c.key} className="text-left px-4 py-2 font-semibold text-muted-foreground">
                    {c.label}
                  </th>
                ))}
                <th className="w-8 px-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={String(item.id ?? i)}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  {columns.map((c, j) => {
                    const fn  = c.renderAs ? RENDERERS[c.renderAs] : undefined
                    const val = item[c.key]
                    return (
                      <td key={c.key} className={`px-4 py-2.5 ${j === 0 ? 'font-medium' : ''}`}>
                        {fn ? fn(val) : val != null && val !== '' ? String(val) : '—'}
                      </td>
                    )
                  })}
                  <td className="px-2 py-2 text-right">
                    <Link
                      href={`${detailBasePath}/${item.id}`}
                      className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
