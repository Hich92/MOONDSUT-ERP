'use client'

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import Link          from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, Home, ChevronRight,
  Search, Building2, X, CheckCircle2,
  MapPin, BarChart2, StickyNote, Fingerprint, HelpCircle,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn }       from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

// ── Types SIRENE ──────────────────────────────────────────────────

interface SireneResult {
  siren:               string
  nom_complet:         string
  nom_raison_sociale:  string
  sigle:               string | null
  date_creation:       string | null
  etat_administratif:  string | null
  nature_juridique:    string | null
  categorie_entreprise:string | null
  activite_principale: string | null
  tranche_effectif_salarie: string | null
  annee_tranche_effectif_salarie: string | null
  siege: {
    siret:           string
    adresse:         string
    libelle_commune: string
    code_postal:     string
    latitude:        string | null
    longitude:       string | null
  }
  dirigeants: {
    nom?:     string
    prenoms?: string
    qualite?: string
    type_dirigeant: string
  }[]
  finances: Record<string, { ca?: number; resultat_net?: number }> | null
  complements: {
    convention_collective_renseignee?: boolean
    est_association?: boolean
    est_ess?: boolean
  } | null
}

// ── Helpers ───────────────────────────────────────────────────────

const TRANCHES: Record<string, string> = {
  NN: 'Non renseigné', '00': '0 salarié', '01': '1-2',   '02': '3-5',
  '03': '6-9',         '11': '10-19',     '12': '20-49', '21': '50-99',
  '22': '100-199',     '31': '200-249',   '32': '250-499',
  '41': '500-999',     '42': '1 000-1 999',
  '51': '2 000-4 999', '52': '5 000-9 999', '53': '10 000+',
}

const NATURES: Record<string, string> = {
  '1000': 'Entrepreneur individuel', '5710': 'SAS', '5720': 'SASU',
  '5499': 'SA', '5308': 'SARL', '5312': 'EURL',
  '6540': 'Société civile professionnelle', '9220': 'Association',
}

function lastFinances(f: SireneResult['finances']) {
  if (!f) return null
  const years = Object.keys(f).sort().reverse()
  if (!years.length) return null
  const yr = years[0]
  return { year: yr, ...f[yr] }
}

function mapSireneToForm(r: SireneResult) {
  const fin = lastFinances(r.finances)
  return {
    name:                 r.nom_complet ?? '',
    siren:                r.siren       ?? '',
    siret:                r.siege?.siret ?? '',
    code_naf:             r.activite_principale ?? '',
    nature_juridique:     r.nature_juridique    ?? '',
    categorie_entreprise: r.categorie_entreprise ?? '',
    tranche_effectif:     r.tranche_effectif_salarie ?? '',
    etat_administratif:   r.etat_administratif ?? '',
    address:              r.siege?.adresse ?? '',
    city:                 r.siege?.libelle_commune ?? '',
    country:              'France',
    latitude:             r.siege?.latitude  ?? '',
    longitude:            r.siege?.longitude ?? '',
    ca_annuel:            fin?.ca            != null ? String(fin.ca)          : '',
    resultat_net:         fin?.resultat_net  != null ? String(fin.resultat_net) : '',
    annee_finances:       fin?.year          ?? '',
  }
}

// ── SIRENE Autocomplete ───────────────────────────────────────────

function SireneSearch({ onSelect }: { onSelect: (r: SireneResult) => void }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<SireneResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef   = useRef<HTMLDivElement>(null)

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
    setQuery('')
    setSelected(null)
    setResults([])
    setOpen(false)
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
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
            const fin = lastFinances(r.finances)
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
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    SIREN {r.siren}
                    {r.siege?.libelle_commune && ` · ${r.siege.libelle_commune}`}
                    {r.activite_principale && ` · NAF ${r.activite_principale}`}
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

// ── Tooltip label helper ──────────────────────────────────────────

function FieldLabel({ children, tip, required }: {
  children: React.ReactNode; tip?: string; required?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="field-label">
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {tip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-default" aria-label={tip}>
              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">{tip}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// ── Form state type ───────────────────────────────────────────────

type FormValues = Record<string, string>

const INITIAL: FormValues = {
  name: '', type: 'prospect', siren: '', siret: '',
  code_naf: '', nature_juridique: '', categorie_entreprise: '', tranche_effectif: '',
  etat_administratif: '', email: '', phone: '', website: '',
  address: '', city: '', country: 'France',
  ca_annuel: '', resultat_net: '', annee_finances: '',
  latitude: '', longitude: '', notes: '',
}

// ── CompanyForm ───────────────────────────────────────────────────

export function CompanyForm() {
  const router  = useRouter()
  const t       = useTranslation()
  const [values,  setValues]  = useState<FormValues>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function set(name: string, value: string) {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  function handleSireneSelect(r: SireneResult) {
    const mapped = mapSireneToForm(r)
    setValues(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(mapped).filter(([, v]) => v !== '')
      ),
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v !== '' && v !== null && v !== undefined) {
        // Convert numeric fields
        if ((k === 'ca_annuel' || k === 'resultat_net') && v !== '') {
          payload[k] = Number(v)
        } else if ((k === 'latitude' || k === 'longitude') && v !== '') {
          payload[k] = parseFloat(v)
        } else {
          payload[k] = v
        }
      }
    }

    try {
      const res  = await fetch('/api/records/companies', {
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
      router.push(newId ? `/dashboard/companies/${newId}` : '/dashboard/companies')
      router.refresh()
    } catch {
      setError(t('detail.net_error'))
      setLoading(false)
    }
  }

  return (
    <TooltipProvider delayDuration={400}>
    <div className="flex flex-col min-h-screen">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard/companies"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="brand-icon flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="page-heading truncate">{t('companies.new')}</h1>
            <nav className="breadcrumb">
              <Link href="/dashboard" className="breadcrumb-link">
                <Home className="w-3 h-3" /><span>{t('list.home')}</span>
              </Link>
              <ChevronRight className="breadcrumb-sep" />
              <Link href="/dashboard/companies" className="breadcrumb-link">{t('module.companies')}</Link>
              <ChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{t('form.new')}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex-1 p-6 max-w-3xl space-y-5">

        {/* SIRENE search — always visible, above tabs */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2 overflow-visible">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            Recherche SIRENE — pré-remplissage automatique
          </p>
          <SireneSearch onSelect={handleSireneSelect} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="identite" className="w-full">
          <TabsList className="w-full justify-start gap-0.5 h-auto flex-wrap bg-muted/60 p-1">
            <TabsTrigger value="identite"    className="gap-1.5 text-xs"><Fingerprint className="w-3.5 h-3.5" />Identité</TabsTrigger>
            <TabsTrigger value="coordonnees" className="gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5" />Coordonnées</TabsTrigger>
            <TabsTrigger value="insee"       className="gap-1.5 text-xs"><BarChart2 className="w-3.5 h-3.5" />Données INSEE</TabsTrigger>
            <TabsTrigger value="notes"       className="gap-1.5 text-xs"><StickyNote className="w-3.5 h-3.5" />Notes</TabsTrigger>
          </TabsList>

          {/* ── Onglet 1 : Identité ─────────────────────────── */}
          <TabsContent value="identite">
            <div className="record-card mt-3 grid grid-cols-2 gap-x-6 gap-y-5">

              <div className="col-span-2 flex flex-col gap-1.5">
                <FieldLabel required tip={t('field.name_tip')}>Nom de la société</FieldLabel>
                <Input required value={values.name} onChange={e => set('name', e.target.value)} placeholder="Acme SAS" />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel required tip={t('field.type_tip')}>{t('field.type')}</FieldLabel>
                <select
                  required value={values.type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => set('type', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="prospect">{t('opt.prospect')}</option>
                  <option value="client">{t('opt.client')}</option>
                  <option value="partner">{t('opt.partner')}</option>
                  <option value="supplier">{t('opt.supplier')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Numéro d'identification unique de l'entreprise (9 chiffres)">SIREN</FieldLabel>
                <Input value={values.siren} onChange={e => set('siren', e.target.value)} placeholder="123456789" maxLength={9} />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip={t('field.siret_tip')}>{t('field.siret')}</FieldLabel>
                <Input value={values.siret} onChange={e => set('siret', e.target.value)} placeholder="12345678900010" maxLength={14} />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Code d'activité principale de l'entreprise (format INSEE)">Code NAF / APE</FieldLabel>
                <Input value={values.code_naf} onChange={e => set('code_naf', e.target.value)} placeholder="62.01Z" />
              </div>

            </div>
          </TabsContent>

          {/* ── Onglet 2 : Coordonnées ──────────────────────── */}
          <TabsContent value="coordonnees">
            <div className="record-card mt-3 grid grid-cols-2 gap-x-6 gap-y-5">

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip={t('field.email_tip')}>{t('field.email')}</FieldLabel>
                <Input type="email" value={values.email} onChange={e => set('email', e.target.value)} placeholder="contact@acme.fr" />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip={t('field.phone_tip')}>{t('field.phone')}</FieldLabel>
                <Input type="tel" value={values.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 1 23 45 67 89" />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <FieldLabel tip={t('field.website_tip')}>{t('field.website')}</FieldLabel>
                <Input value={values.website} onChange={e => set('website', e.target.value)} placeholder="https://acme.fr" />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <FieldLabel tip={t('field.address_tip')}>{t('field.address')}</FieldLabel>
                <Input value={values.address} onChange={e => set('address', e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip={t('field.city_tip')}>{t('field.city')}</FieldLabel>
                <Input value={values.city} onChange={e => set('city', e.target.value)} placeholder="Paris" />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip={t('field.country_tip')}>{t('field.country')}</FieldLabel>
                <Input value={values.country} onChange={e => set('country', e.target.value)} placeholder="France" />
              </div>

            </div>
          </TabsContent>

          {/* ── Onglet 3 : Données INSEE ─────────────────────── */}
          <TabsContent value="insee">
            <div className="record-card mt-3 grid grid-cols-2 gap-x-6 gap-y-5">

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Code INSEE de la forme juridique (ex. 5710 = SAS). Pré-rempli depuis SIRENE.">Nature juridique</FieldLabel>
                <div className="relative">
                  <Input
                    value={values.nature_juridique}
                    onChange={e => set('nature_juridique', e.target.value)}
                    placeholder="5710"
                  />
                  {NATURES[values.nature_juridique] && (
                    <p className="mt-1 text-xs text-muted-foreground">{NATURES[values.nature_juridique]}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Catégorie selon la taille de l'entreprise : PME (&lt;250 sal.), ETI (&lt;5000 sal.), GE (5000+ sal.)">Catégorie entreprise</FieldLabel>
                <select
                  value={values.categorie_entreprise}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => set('categorie_entreprise', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Choisir —</option>
                  <option value="PME">PME</option>
                  <option value="ETI">ETI</option>
                  <option value="GE">Grande Entreprise</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Code INSEE de la tranche d'effectif salarié. Pré-rempli depuis SIRENE.">Tranche d'effectif</FieldLabel>
                <select
                  value={values.tranche_effectif}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => set('tranche_effectif', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Choisir —</option>
                  {Object.entries(TRANCHES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="A = entreprise active, C = entreprise cessée (source SIRENE)">État administratif</FieldLabel>
                <select
                  value={values.etat_administratif}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => set('etat_administratif', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Choisir —</option>
                  <option value="A">A — Active</option>
                  <option value="C">C — Cessée</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Chiffre d'affaires annuel en euros (source SIRENE ou saisie manuelle)">CA annuel (€)</FieldLabel>
                <Input type="number" value={values.ca_annuel} onChange={e => set('ca_annuel', e.target.value)} placeholder="5000000" />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Résultat net annuel en euros (source SIRENE ou saisie manuelle)">Résultat net (€)</FieldLabel>
                <Input type="number" value={values.resultat_net} onChange={e => set('resultat_net', e.target.value)} placeholder="250000" />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Année de référence des données financières (ex. 2024)">Année des finances</FieldLabel>
                <Input value={values.annee_finances} onChange={e => set('annee_finances', e.target.value)} placeholder="2024" maxLength={4} />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel tip="Coordonnées géographiques du siège (latitude et longitude). Pré-remplies depuis SIRENE.">Coordonnées GPS</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={values.latitude}  onChange={e => set('latitude',  e.target.value)} placeholder="Latitude"  />
                  <Input value={values.longitude} onChange={e => set('longitude', e.target.value)} placeholder="Longitude" />
                </div>
              </div>

            </div>
          </TabsContent>

          {/* ── Onglet 4 : Notes ─────────────────────────────── */}
          <TabsContent value="notes">
            <div className="record-card mt-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel tip={t('field.notes_tip')}>{t('field.notes')}</FieldLabel>
                <Textarea
                  value={values.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Notes internes, contexte, historique…"
                  className="min-h-[160px]"
                />
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm font-semibold text-destructive">{t('detail.save_error')}</p>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="action-btn-primary">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? t('form.saving') : t('form.create')}
          </Button>
          <Button type="button" variant="outline" className="action-btn-secondary" asChild>
            <Link href="/dashboard/companies">{t('form.cancel')}</Link>
          </Button>
        </div>

      </form>
    </div>
    </TooltipProvider>
  )
}
