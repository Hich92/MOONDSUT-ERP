'use client'
import { useState, type FormEvent, type ChangeEvent } from 'react'
import Link          from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Home, ChevronRight, HelpCircle } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { LinkedRecordSearch } from './LinkedRecordSearch'
import { cn }       from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'
import type { TKey }      from '@/hooks/use-translation'

// ── Types ────────────────────────────────────────────────────────

export type FieldType =
  | 'text' | 'email' | 'tel' | 'number' | 'date'
  | 'select' | 'textarea' | 'checkbox' | 'linked'

export interface FieldConfig {
  name:           string
  label:          string
  type:           FieldType
  required?:      boolean
  placeholder?:   string
  options?:       { value: string; label: string }[]
  span?:          boolean
  defaultValue?:  string | boolean | number
  defaultLabel?:  string
  tooltip?:       string
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

interface FormPageProps {
  title:     string
  iconNode:  React.ReactNode
  fields:    FieldConfig[]
  apiTable:  string
  backHref:  string
  subtitle?: string
}

// ── FormPage ──────────────────────────────────────────────────────

export function FormPage({
  title, iconNode,
  fields, apiTable, backHref, subtitle,
}: FormPageProps) {
  const router = useRouter()
  const t      = useTranslation()

  const initial = Object.fromEntries(
    fields.map(f => [f.name, f.defaultValue ?? (f.type === 'checkbox' ? false : '')])
  )
  const [values,  setValues]  = useState<Record<string, unknown>>(initial)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const moduleSlug  = backHref.split('/').pop() ?? ''
  const moduleKey   = MODULE_KEYS[moduleSlug]
  const moduleLabel = moduleKey ? t(moduleKey) : moduleSlug

  function setValue(name: string, value: unknown) {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v !== '' && v !== null && v !== undefined && v !== 0) payload[k] = v
    }

    try {
      const res  = await fetch(`/api/records/${apiTable}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? t('detail.save_error'))
        setLoading(false)
        return
      }

      const newId = data.id ?? data.data?.id
      router.push(newId ? `${backHref}/${newId}` : backHref)
      router.refresh()
    } catch {
      setError(t('detail.net_error'))
      setLoading(false)
    }
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col min-h-screen">
        {/* ── Sticky header ────────────────────────────────────── */}
        <header className="page-header">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" asChild>
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
                <span className="breadcrumb-current">{t('form.new')}</span>
              </nav>
            </div>
          </div>
        </header>

        {/* ── Form ─────────────────────────────────────────────── */}
        <div className="flex-1 p-6 max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="record-card mb-5">
              {subtitle && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {subtitle}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {fields.map(field => (
                  <FieldRow
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    onChange={setValue}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm font-semibold text-destructive">{t('detail.save_error')}</p>
                <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading} className="action-btn-primary">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? t('form.saving') : t('form.create')}
              </Button>
              <Button type="button" variant="outline" className="action-btn-secondary" asChild>
                <Link href={backHref}>{t('form.cancel')}</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ── FieldRow ─────────────────────────────────────────────────────

function FieldRow({
  field, value, onChange,
}: {
  field:    FieldConfig
  value:    unknown
  onChange: (name: string, value: unknown) => void
}) {
  const t = useTranslation()

  if (field.type === 'checkbox') {
    return (
      <div className="col-span-2 flex items-center gap-2.5 py-1">
        <Checkbox
          id={field.name}
          checked={Boolean(value)}
          onCheckedChange={checked => onChange(field.name, checked)}
        />
        <label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
          {field.label}
        </label>
        {field.tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-default" aria-label={field.tooltip}>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              {field.tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1.5', field.span && 'col-span-2')}>
      {/* Label + optional tooltip */}
      <div className="flex items-center gap-1">
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {field.tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-default" aria-label={field.tooltip}>
                <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {field.tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Input */}
      {field.type === 'linked' ? (
        <LinkedRecordSearch
          id={field.name}
          table={field.linkedTable!}
          labelField={field.linkedLabelField ?? 'name'}
          subField={field.linkedSubField}
          placeholder={field.placeholder}
          value={Number(value) || 0}
          defaultLabel={field.defaultLabel}
          onChange={id => onChange(field.name, id)}
          required={field.required}
        />
      ) : field.type === 'textarea' ? (
        <Textarea
          id={field.name} name={field.name}
          placeholder={field.placeholder}
          required={field.required}
          value={String(value ?? '')}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(field.name, e.target.value)}
          className="min-h-[96px]"
        />
      ) : field.type === 'select' ? (
        <select
          id={field.name} name={field.name}
          required={field.required}
          value={String(value ?? '')}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(field.name, e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{t('form.choose')}</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <Input
          id={field.name} name={field.name}
          type={field.type}
          placeholder={field.placeholder}
          required={field.required}
          value={String(value ?? '')}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(field.name, e.target.value)}
          step={field.type === 'number' ? 'any' : undefined}
        />
      )}
    </div>
  )
}
