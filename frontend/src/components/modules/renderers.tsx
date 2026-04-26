import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

// ── Status badge maps ─────────────────────────────────────────────

const STAGE_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  lead:           { label: 'Lead',           variant: 'secondary' },
  qualification:  { label: 'Qualification',  variant: 'info'      },
  proposition:    { label: 'Proposition',    variant: 'warning'   },
  negotiation:    { label: 'Négociation',    variant: 'purple'    },
  won:            { label: 'Gagné',          variant: 'success'   },
  lost:           { label: 'Perdu',          variant: 'destructive' },
}

const CONTRACT_STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  draft:   { label: 'Brouillon', variant: 'secondary'   },
  active:  { label: 'Actif',     variant: 'success'     },
  expired: { label: 'Expiré',    variant: 'warning'     },
  closed:  { label: 'Clôturé',   variant: 'outline'     },
}

const PROJECT_STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  planned:    { label: 'Planifié',    variant: 'secondary' },
  in_progress:{ label: 'En cours',   variant: 'info'      },
  on_hold:    { label: 'En attente', variant: 'warning'   },
  delivered:  { label: 'Livré',      variant: 'success'   },
  cancelled:  { label: 'Annulé',     variant: 'destructive' },
}

const TASK_STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  todo:        { label: 'À faire',   variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'info'      },
  review:      { label: 'Review',   variant: 'warning'   },
  done:        { label: 'Fait',     variant: 'success'   },
}

const PARTNER_TYPE_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  contact:     { label: 'Contact',     variant: 'secondary'   },
  prospect:    { label: 'Prospect',    variant: 'info'        },
  client:      { label: 'Client',      variant: 'success'     },
  'ex-client': { label: 'Ex-client',   variant: 'outline'     },
  fournisseur: { label: 'Fournisseur', variant: 'warning'     },
  partenaire:  { label: 'Partenaire',  variant: 'purple'      },
  // legacy values
  Client:      { label: 'Client',      variant: 'success'     },
  Partner:     { label: 'Partenaire',  variant: 'purple'      },
  Provider:    { label: 'Fournisseur', variant: 'warning'     },
}
/** @deprecated use renderPartnerType */
const CONTACT_TYPE_MAP = PARTNER_TYPE_MAP

const SUPPLIER_CONTRACT_STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  draft:   { label: 'Brouillon', variant: 'secondary' },
  active:  { label: 'Actif',     variant: 'success'   },
  expired: { label: 'Expiré',    variant: 'warning'   },
  closed:  { label: 'Clôturé',   variant: 'outline'   },
}

const PURCHASE_ORDER_STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  draft:               { label: 'Brouillon',          variant: 'secondary'   },
  sent:                { label: 'Envoyé',              variant: 'info'        },
  confirmed:           { label: 'Confirmé',            variant: 'purple'      },
  partially_received:  { label: 'Reçu partiellement', variant: 'warning'     },
  received:            { label: 'Reçu',                variant: 'success'     },
  cancelled:           { label: 'Annulé',              variant: 'destructive' },
}

const SUPPLIER_INVOICE_STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  draft:    { label: 'Brouillon', variant: 'secondary'   },
  received: { label: 'Reçue',     variant: 'info'        },
  to_pay:   { label: 'À payer',   variant: 'warning'     },
  paid:     { label: 'Payée',     variant: 'success'     },
  disputed: { label: 'Litigieuse',variant: 'destructive' },
}

// ── Render helpers ─────────────────────────────────────────────────

export function renderStage(val: unknown) {
  const v = String(val ?? '')
  const m = STAGE_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderContractStatus(val: unknown) {
  const v = String(val ?? '')
  const m = CONTRACT_STATUS_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderProjectStatus(val: unknown) {
  const v = String(val ?? '')
  const m = PROJECT_STATUS_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderTaskStatus(val: unknown) {
  const v = String(val ?? '')
  const m = TASK_STATUS_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderPartnerType(val: unknown) {
  const v = String(val ?? '')
  const m = PARTNER_TYPE_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}
/** @deprecated alias */
export const renderContactType = renderPartnerType

export function renderAmount(val: unknown) {
  const n = Number(val)
  if (isNaN(n)) return <span className="text-muted-foreground">—</span>
  return (
    <span className="font-medium tabular-nums">
      {n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
    </span>
  )
}

export function renderPercent(val: unknown) {
  const n = Number(val)
  if (isNaN(n)) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(n, 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums">{n}%</span>
    </div>
  )
}

export function renderBool(val: unknown) {
  return val ? (
    <Badge variant="success" className="text-[10px]">Oui</Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px]">Non</Badge>
  )
}

export function renderSupplierContractStatus(val: unknown) {
  const v = String(val ?? '')
  const m = SUPPLIER_CONTRACT_STATUS_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderPurchaseOrderStatus(val: unknown) {
  const v = String(val ?? '')
  const m = PURCHASE_ORDER_STATUS_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderSupplierInvoiceStatus(val: unknown) {
  const v = String(val ?? '')
  const m = SUPPLIER_INVOICE_STATUS_MAP[v]
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <span>{v || '—'}</span>
}

export function renderDate(val: unknown) {
  if (!val) return <span className="text-muted-foreground">—</span>
  try {
    return <span>{new Date(String(val)).toLocaleDateString('fr-FR')}</span>
  } catch {
    return <span>{String(val)}</span>
  }
}
