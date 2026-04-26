'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter }  from 'next/navigation'
import {
  Building2, User, HelpCircle, Search, X, CheckCircle2, Loader2,
} from 'lucide-react'
import { Button }     from '@/components/ui/button'
import { Input }      from '@/components/ui/input'
import { Textarea }   from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LinkedRecordSearch } from './LinkedRecordSearch'
import { cn }         from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

// ── SIRENE types & helpers ────────────────────────────────────────

interface SireneResult {
  siren:                string
  nom_complet:          string
  nom_raison_sociale:   string | null
  sigle:                string | null
  activite_principale:  string | null
  nature_juridique:     string | null
  categorie_entreprise: string | null
  tranche_effectif_salarie: string | null
  etat_administratif:   string | null
  siege: {
    siret:           string
    adresse:         string | null
    libelle_commune: string | null
    code_postal:     string | null
    code_commune:    string | null
    latitude:        string | null
    longitude:       string | null
  }
  finances: Record<string, { ca?: number; resultat_net?: number }> | null
}

const TRANCHES: Record<string, string> = {
  NN: 'Non renseigné', '00': '0 salarié', '01': '1-2',   '02': '3-5',
  '03': '6-9',         '11': '10-19',     '12': '20-49', '21': '50-99',
  '22': '100-199',     '31': '200-249',   '32': '250-499',
  '41': '500-999',     '42': '1 000-1 999',
  '51': '2 000-4 999', '52': '5 000-9 999', '53': '10 000+',
}

function lastFinances(f: SireneResult['finances']) {
  if (!f) return null
  const years = Object.keys(f).sort().reverse()
  if (!years.length) return null
  const yr = years[0]
  return { year: yr, ...f[yr] }
}

function mapSireneToForm(r: SireneResult): Record<string, unknown> {
  const fin = lastFinances(r.finances)
  return {
    name:                 r.nom_complet       ?? '',
    enseigne:             r.sigle             ?? '',
    siren:                r.siren             ?? '',
    siret:                r.siege?.siret      ?? '',
    code_naf:             r.activite_principale ?? '',
    nature_juridique:     r.nature_juridique  ?? '',
    categorie_entreprise: r.categorie_entreprise ?? '',
    tranche_effectif:     r.tranche_effectif_salarie ?? '',
    etat_administratif:   r.etat_administratif ?? '',
    address:              r.siege?.adresse    ?? '',
    city:                 r.siege?.libelle_commune ?? '',
    zip:                  r.siege?.code_postal ?? '',
    code_commune:         r.siege?.code_commune ?? '',
    country:              'France',
    latitude:             r.siege?.latitude   ?? '',
    longitude:            r.siege?.longitude  ?? '',
    ca_annuel:            fin?.ca             != null ? String(fin.ca)          : '',
    resultat_net:         fin?.resultat_net   != null ? String(fin.resultat_net) : '',
    annee_finances:       fin?.year           ?? '',
  }
}

// ── SireneSearch sub-component ────────────────────────────────────

function SireneSearch({ onSelect }: { onSelect: (r: SireneResult) => void }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<SireneResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/sirene?q=${encodeURIComponent(query)}&per_page=8`)
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 320)
  }, [query])

  function pick(r: SireneResult) {
    setSelected(r.siren)
    setQuery(r.nom_complet)
    setOpen(false)
    onSelect(r)
  }

  function clear() {
    setQuery(''); setSelected(null); setResults([]); setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher par nom, SIREN, SIRET…"
          className={cn(
            'w-full pl-9 pr-10 h-10 rounded-lg border bg-background text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
            selected && 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20',
          )}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        {!loading && query && (
          <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {selected && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Fiche pré-remplie depuis le SIRENE — vérifiez et complétez si besoin
        </p>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          {results.map(r => {
            const fin    = lastFinances(r.finances)
            const tranche = TRANCHES[r.tranche_effectif_salarie ?? ''] ?? r.tranche_effectif_salarie
            return (
              <button
                key={r.siren}
                type="button"
                onClick={() => pick(r)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b border-border last:border-0"
              >
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.nom_complet}</p>
                  {r.sigle && r.sigle !== r.nom_complet && (
                    <p className="text-xs text-primary/80 truncate">{r.sigle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    SIREN {r.siren}
                    {r.siege?.libelle_commune && ` · ${r.siege.libelle_commune}`}
                    {r.siege?.code_postal     && ` (${r.siege.code_postal})`}
                    {r.activite_principale    && ` · NAF ${r.activite_principale}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {r.categorie_entreprise && (
                      <span className="text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded px-1.5 py-0.5">
                        {r.categorie_entreprise}
                      </span>
                    )}
                    {tranche && tranche !== 'Non renseigné' && (
                      <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                        {tranche} sal.
                      </span>
                    )}
                    {fin?.ca != null && (
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded px-1.5 py-0.5">
                        CA {(fin.ca / 1_000_000).toFixed(1)} M€ ({fin.year})
                      </span>
                    )}
                    {r.etat_administratif === 'C' && (
                      <span className="text-[10px] font-medium bg-red-50 text-red-600 rounded px-1.5 py-0.5">
                        Cessée
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-2xl px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">Aucun résultat pour « {query} »</p>
        </div>
      )}
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────

const PARTNER_TYPES = [
  { value: 'contact',     label: 'Contact'     },
  { value: 'prospect',    label: 'Prospect'    },
  { value: 'client',      label: 'Client'      },
  { value: 'ex-client',   label: 'Ex-client'   },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'partenaire',  label: 'Partenaire'  },
]

const LEGAL_FORMS = ['SAS', 'SARL', 'SA', 'SCI', 'EURL', 'EI', 'SASU', 'GIE', 'Association', 'Autre']

const PAYMENT_OPTIONS = [
  { value: '0',  label: 'Immédiat'  },
  { value: '15', label: '15 jours'  },
  { value: '30', label: '30 jours'  },
  { value: '45', label: '45 jours'  },
  { value: '60', label: '60 jours'  },
  { value: '90', label: '90 jours'  },
]

// ── Field helper ──────────────────────────────────────────────────

function Field({
  label, tip, required, children,
}: {
  label: string; tip?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}{required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {tip && (
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">{tip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

interface PartnerFormProps {
  initialIsCompany?: boolean
  initialType?:      string
  initialParentId?:  number
  backHref?:         string
}

export function PartnerForm({
  initialIsCompany = false,
  initialType      = 'contact',
  initialParentId,
  backHref         = '/dashboard/partners',
}: PartnerFormProps) {
  const router = useRouter()
  const t      = useTranslation()

  const [isCompany, setIsCompany] = useState(initialIsCompany)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [form,      setForm]      = useState<Record<string, unknown>>({
    type:          initialType,
    parent_id:     initialParentId ?? null,
    payment_terms: '30',
    country:       'France',
    is_company:    initialIsCompany,
  })

  function set(key: string, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function handleSireneSelect(r: SireneResult) {
    const mapped = mapSireneToForm(r)
    setForm(prev => ({
      ...prev,
      ...Object.fromEntries(Object.entries(mapped).filter(([, v]) => v !== '')),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = { ...form, is_company: isCompany }
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') payload[k] = null
    })
    // Numeric fields
    for (const k of ['ca_annuel', 'resultat_net']) {
      if (payload[k] != null) payload[k] = Number(payload[k])
    }
    for (const k of ['latitude', 'longitude']) {
      if (payload[k] != null) payload[k] = parseFloat(String(payload[k]))
    }

    try {
      const res  = await fetch('/api/records/partners', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Erreur'); return }
      router.push(`${backHref}/${data.id ?? ''}`)
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto p-6">

      {/* ── Toggle Société / Particulier ─────────────────────────── */}
      <div className="flex gap-3 p-1 rounded-xl bg-muted/50 border w-fit">
        <button
          type="button"
          onClick={() => { setIsCompany(true); set('is_company', true) }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            isCompany ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Building2 className="w-4 h-4" />
          {t('partners.toggle_company')}
        </button>
        <button
          type="button"
          onClick={() => { setIsCompany(false); set('is_company', false) }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            !isCompany ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <User className="w-4 h-4" />
          {t('partners.toggle_person')}
        </button>
      </div>

      {/* ── SIRENE autocomplete (sociétés uniquement) ─────────────── */}
      {isCompany && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2 overflow-visible">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            Recherche SIRENE — pré-remplissage automatique
          </p>
          <SireneSearch onSelect={handleSireneSelect} />
        </div>
      )}

      {/* ── Type + Nom ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('field.type')} required tip={t('field.type_tip')}>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={String(form.type ?? 'contact')}
            onChange={e => set('type', e.target.value)}
          >
            {PARTNER_TYPES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        {isCompany ? (
          <Field label="Raison sociale" required tip={t('field.name_tip')}>
            <Input
              required value={String(form.name ?? '')}
              onChange={e => set('name', e.target.value)}
              placeholder="Acme Corp SAS"
            />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-2 col-span-1">
            <Field label={t('field.first_name')} tip={t('field.first_name_tip')}>
              <Input
                value={String(form.first_name ?? '')}
                onChange={e => set('first_name', e.target.value)}
                placeholder="Jean"
              />
            </Field>
            <Field label={t('field.name')} required tip={t('field.name_tip')}>
              <Input
                required value={String(form.name ?? '')}
                onChange={e => set('name', e.target.value)}
                placeholder="Dupont"
              />
            </Field>
          </div>
        )}
      </div>

      {/* ── Particulier : société parente ────────────────────────── */}
      {!isCompany && (
        <Field label={t('field.parent')} tip={t('field.parent_tip')}>
          <LinkedRecordSearch
            table="partners"
            labelField="name"
            subField="type"
            value={initialParentId ?? 0}
            placeholder={t('linked.placeholder')}
            onChange={val => set('parent_id', val)}
          />
        </Field>
      )}

      {/* ── Contact ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Field label={t('field.email')} tip={t('field.email_tip')}>
          <Input type="email" value={String(form.email ?? '')} onChange={e => set('email', e.target.value)} placeholder="contact@acme.fr" />
        </Field>
        <Field label={t('field.phone')} tip={t('field.phone_tip')}>
          <Input type="tel" value={String(form.phone ?? '')} onChange={e => set('phone', e.target.value)} placeholder="+33 1 23 45 67 89" />
        </Field>
        <Field label={t('field.mobile')} tip={t('field.mobile_tip')}>
          <Input type="tel" value={String(form.mobile ?? '')} onChange={e => set('mobile', e.target.value)} placeholder="+33 6 12 34 56 78" />
        </Field>
      </div>

      {/* ── Champs Société ───────────────────────────────────────── */}
      {isCompany && (
        <>
          {/* Informations légales */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
            <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Informations légales</p>
            <Field label="SIREN" tip="Numéro unique d'identification (9 chiffres)">
              <Input value={String(form.siren ?? '')} onChange={e => set('siren', e.target.value)} placeholder="123 456 789" maxLength={9} />
            </Field>
            <Field label="SIRET siège" tip={t('field.siret_tip')}>
              <Input value={String(form.siret ?? '')} onChange={e => set('siret', e.target.value)} placeholder="123 456 789 00012" maxLength={14} />
            </Field>
            <Field label="Enseigne commerciale" tip="Nom commercial ou enseigne, différent de la raison sociale">
              <Input value={String(form.enseigne ?? '')} onChange={e => set('enseigne', e.target.value)} placeholder="Acme Corp" />
            </Field>
            <Field label="Date de création" tip="Date de création de l'établissement (source SIRENE)">
              <Input type="date" value={String(form.date_creation ?? '')} onChange={e => set('date_creation', e.target.value)} />
            </Field>
            <Field label={t('field.legal_form')} tip={t('field.legal_form_tip')}>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={String(form.legal_form ?? '')}
                onChange={e => set('legal_form', e.target.value)}
              >
                <option value="">— {t('form.choose')} —</option>
                {LEGAL_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label={t('field.vat')} tip={t('field.vat_tip')}>
              <Input value={String(form.vat ?? '')} onChange={e => set('vat', e.target.value)} placeholder="FR12345678901" />
            </Field>
            <Field label="Code NAF" tip="Code APE / NAF de l'activité principale">
              <Input value={String(form.code_naf ?? '')} onChange={e => set('code_naf', e.target.value)} placeholder="6201Z" />
            </Field>
            <Field label={t('field.website')} tip={t('field.website_tip')}>
              <Input type="url" value={String(form.website ?? '')} onChange={e => set('website', e.target.value)} placeholder="https://acme.fr" />
            </Field>
          </div>

          {/* Données INSEE */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
            <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Données INSEE / SIRENE</p>
            <Field label="Catégorie entreprise" tip="PME, ETI ou Grande Entreprise (source SIRENE)">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={String(form.categorie_entreprise ?? '')}
                onChange={e => set('categorie_entreprise', e.target.value)}
              >
                <option value="">— Choisir —</option>
                <option value="PME">PME</option>
                <option value="ETI">ETI</option>
                <option value="GE">Grande Entreprise</option>
              </select>
            </Field>
            <Field label="Tranche d'effectif" tip="Tranche de salariés (source SIRENE)">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={String(form.tranche_effectif ?? '')}
                onChange={e => set('tranche_effectif', e.target.value)}
              >
                <option value="">— Choisir —</option>
                {Object.entries(TRANCHES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="État administratif" tip="A = active, C = cessée (source SIRENE)">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={String(form.etat_administratif ?? '')}
                onChange={e => set('etat_administratif', e.target.value)}
              >
                <option value="">— Choisir —</option>
                <option value="A">A — Active</option>
                <option value="C">C — Cessée</option>
              </select>
            </Field>
            <Field label="CA annuel (€)" tip="Chiffre d'affaires annuel (source SIRENE ou saisie)">
              <Input type="number" value={String(form.ca_annuel ?? '')} onChange={e => set('ca_annuel', e.target.value)} placeholder="5000000" />
            </Field>
            <Field label="Résultat net (€)" tip="Résultat net annuel (source SIRENE ou saisie)">
              <Input type="number" value={String(form.resultat_net ?? '')} onChange={e => set('resultat_net', e.target.value)} placeholder="250000" />
            </Field>
            <Field label="Année des finances" tip="Année de référence des données financières">
              <Input value={String(form.annee_finances ?? '')} onChange={e => set('annee_finances', e.target.value)} placeholder="2024" maxLength={4} />
            </Field>
          </div>
        </>
      )}

      {/* ── Adresse ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('field.address')} tip={t('field.address_tip')}>
          <Input value={String(form.address ?? '')} onChange={e => set('address', e.target.value)} placeholder="1 rue de la Paix" />
        </Field>
        <Field label={t('field.city')} tip={t('field.city_tip')}>
          <Input value={String(form.city ?? '')} onChange={e => set('city', e.target.value)} placeholder="Paris" />
        </Field>
        <Field label={t('field.zip')} tip={t('field.zip_tip')}>
          <Input value={String(form.zip ?? '')} onChange={e => set('zip', e.target.value)} placeholder="75001" />
        </Field>
        <Field label={t('field.country')} tip={t('field.country_tip')}>
          <Input value={String(form.country ?? '')} onChange={e => set('country', e.target.value)} placeholder="France" />
        </Field>
        <Field label={t('field.payment_terms')} tip={t('field.payment_terms_tip')}>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={String(form.payment_terms ?? '30')}
            onChange={e => set('payment_terms', e.target.value)}
          >
            {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <Field label={t('field.notes')} tip={t('field.notes_tip')}>
        <Textarea
          rows={3}
          value={String(form.notes ?? '')}
          onChange={e => set('notes', e.target.value)}
          placeholder="Notes internes…"
        />
      </Field>

      {/* ── Error + Submit ────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="min-w-[120px]">
          {saving ? t('form.saving') : t('form.create')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  )
}
