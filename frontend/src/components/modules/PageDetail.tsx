'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Save, X, Loader2,
  Home, ChevronRight, ExternalLink, HelpCircle,
} from 'lucide-react'
import { Button }          from '@/components/ui/button'
import { Input }           from '@/components/ui/input'
import { Textarea }        from '@/components/ui/textarea'
import { Checkbox }        from '@/components/ui/checkbox'
import { Separator }       from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { ActivitiesPanel }  from './ActivitiesPanel'
import { AttachmentsPanel } from './AttachmentsPanel'
import { LinkedRecordSearch } from './LinkedRecordSearch'
import { cn }              from '@/lib/utils'
import {
  renderStage, renderContractStatus, renderProjectStatus,
  renderTaskStatus, renderContactType, renderPartnerType,
  renderSupplierContractStatus, renderPurchaseOrderStatus, renderSupplierInvoiceStatus,
  renderAmount, renderPercent, renderBool, renderDate,
} from './renderers'
import { useTranslation } from '@/hooks/use-translation'
import type { TKey }      from '@/hooks/use-translation'

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
export type EditType =
  | 'text' | 'email' | 'tel' | 'number' | 'date'
  | 'select' | 'textarea' | 'checkbox' | 'readonly' | 'linked'

export interface FieldDef {
  key:            string
  label:          string
  span?:          boolean
  tooltip?:       string
  // Display (read-only)
  renderAs?:      keyof typeof RENDERERS
  // FK navigation
  goToPath?:      string
  resolvedLabel?: string
  // Edit
  editType?:      EditType
  editOptions?:   { value: string; label: string }[]
  // linked-type extras
  linkedTable?:      string
  linkedLabelField?: string
  linkedSubField?:   string
}

const MODULE_KEYS: Record<string, TKey> = {
  partners:      'module.partners',
  companies:     'module.partners',
  contacts:      'module.partners',
  opportunities: 'module.opportunities',
  contracts:     'module.contracts',
  projects:      'module.projects',
  tasks:         'module.tasks',
  invoices:      'module.invoices',
}

// ── Props ────────────────────────────────────────────────────────
interface PageDetailProps {
  title:        string
  subtitle?:    string
  iconNode:     React.ReactNode
  icon?:        unknown
  iconColor?:   string
  iconBg?:      string
  backHref:     string
  record:       Record<string, unknown>
  fields:       FieldDef[]
  relatedTable: string
  statusBar?:   React.ReactNode
  tabs?:        React.ReactNode
}

// ════════════════════════════════════════════════════════════════
export function PageDetail({
  title, subtitle, iconNode,
  backHref, record, fields, relatedTable, statusBar, tabs,
}: PageDetailProps) {
  const router = useRouter()
  const t      = useTranslation()
  const id     = Number(record.id)

  const moduleSlug  = backHref.split('/').pop() ?? ''
  const moduleKey   = MODULE_KEYS[moduleSlug]
  const moduleLabel = moduleKey ? t(moduleKey) : moduleSlug

  // ── Edit state ───────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [values,    setValues]    = useState<Record<string, unknown>>(record)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function startEdit() {
    setValues({ ...record })
    setError(null)
    setIsEditing(true)
  }

  function cancelEdit() {
    setValues({ ...record })
    setError(null)
    setIsEditing(false)
  }

  function setValue(key: string, value: unknown) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {}
    for (const f of fields) {
      if (f.editType && f.editType !== 'readonly') {
        const v = values[f.key]
        // Omit zero-valued linked fields (means "cleared / none")
        if (f.editType === 'linked' && (v === 0 || v === '0' || v === '')) continue
        payload[f.key] = v
      }
    }

    try {
      const res  = await fetch(`/api/records/${relatedTable}/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? t('detail.save_error'))
        setLoading(false)
        return
      }

      setIsEditing(false)
      router.refresh()
    } catch {
      setError(t('detail.net_error'))
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="page-header">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href={backHref}><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div className="brand-icon flex-shrink-0">
              {iconNode}
            </div>
            <div className="min-w-0">
              <h1 className="page-heading truncate">{title}</h1>
              <nav className="breadcrumb">
                <Link href="/dashboard" className="breadcrumb-link">
                  <Home className="w-3 h-3" /><span>{t('list.home')}</span>
                </Link>
                <ChevronRight className="breadcrumb-sep" />
                <Link href={backHref} className="breadcrumb-link">{moduleLabel}</Link>
                <ChevronRight className="breadcrumb-sep" />
                <span className="breadcrumb-current truncate max-w-[180px]">{title}</span>
              </nav>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEditing ? (
              <Button
                size="sm" variant="outline"
                className="action-btn-secondary"
                onClick={startEdit}
              >
                <Pencil className="w-3.5 h-3.5 text-primary" />
                {t('detail.edit')}
              </Button>
            ) : (
              <>
                <Button
                  size="sm" variant="outline"
                  className="action-btn-secondary"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  <X className="w-3.5 h-3.5" />
                  {t('detail.cancel')}
                </Button>
                <Button
                  size="sm"
                  className="action-btn-primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Save className="w-3.5 h-3.5" />}
                  {loading ? t('detail.saving') : t('detail.save')}
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Status bar */}
        {statusBar && (
          <div className="px-6 py-3 border-b bg-muted/30 flex-shrink-0 overflow-x-auto">
            {statusBar}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="record-card">
              {subtitle && !isEditing && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {subtitle}
                </p>
              )}

              {/* Error banner */}
              {error && (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-sm font-semibold text-destructive">{t('detail.save_error')}</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
                {fields.map(f => (
                  <div key={f.key} className={cn('flex flex-col gap-1.5', f.span && 'col-span-2')}>
                    {/* Label + optional tooltip */}
                    <dt className="flex items-center gap-1">
                      <span className="field-label">{f.label}</span>
                      {f.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-default" aria-label={f.tooltip}>
                              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            {f.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </dt>
                    <dd>
                      {isEditing && f.editType && f.editType !== 'readonly'
                        ? <EditField
                            field={f}
                            value={values[f.key]}
                            onChange={v => setValue(f.key, v)}
                          />
                        : <ReadField field={f} value={record[f.key]} />
                      }
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <AttachmentsPanel relatedTable={relatedTable} relatedId={id} />

            {tabs && (
              <div className="mt-6">
                <Separator className="mb-6" />
                {tabs}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Activities sidebar ─────────────────────────────────── */}
      <ActivitiesPanel relatedTable={relatedTable} relatedId={id} />
    </div>
  )
}

// ── ReadField — read-only display ────────────────────────────────
function ReadField({ field, value }: { field: FieldDef; value: unknown }) {
  const t       = useTranslation()
  const display = field.resolvedLabel
    ?? (field.renderAs ? null : (value != null && value !== '' ? String(value) : null))

  const content = field.renderAs
    ? (() => { const fn = RENDERERS[field.renderAs!]; return fn ? fn(value) : String(value ?? '—') })()
    : display != null
      ? <span className="field-value">{display}</span>
      : <span className="text-muted-foreground/40">—</span>

  if (field.goToPath && value != null && value !== '') {
    return (
      <span className="flex items-center gap-2">
        <span className="field-value">{field.resolvedLabel ?? String(value)}</span>
        <Link
          href={`${field.goToPath}/${value}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />{t('common.open')}
        </Link>
      </span>
    )
  }

  return <span className="field-value">{content}</span>
}

// ── EditField — champ éditable ────────────────────────────────────
function EditField({
  field, value, onChange,
}: {
  field:    FieldDef
  value:    unknown
  onChange: (v: unknown) => void
}) {
  const cls = 'h-9 text-sm'

  if (field.editType === 'linked') {
    return (
      <LinkedRecordSearch
        table={field.linkedTable!}
        labelField={field.linkedLabelField ?? 'name'}
        subField={field.linkedSubField}
        value={Number(value) || 0}
        defaultLabel={field.resolvedLabel}
        onChange={id => onChange(id || null)}
      />
    )
  }

  if (field.editType === 'checkbox') {
    return (
      <div className="flex items-center gap-2 h-9">
        <Checkbox
          id={`edit-${field.key}`}
          checked={Boolean(value)}
          onCheckedChange={checked => onChange(checked)}
        />
        <label htmlFor={`edit-${field.key}`} className="text-sm cursor-pointer">
          {field.label}
        </label>
      </div>
    )
  }

  if (field.editType === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        className={cn(
          cls,
          'flex w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
      >
        {field.editOptions?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (field.editType === 'textarea') {
    return (
      <Textarea
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        className="min-h-[80px] text-sm"
      />
    )
  }

  return (
    <Input
      type={field.editType ?? 'text'}
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
      className={cls}
      step={field.editType === 'number' ? 'any' : undefined}
    />
  )
}
