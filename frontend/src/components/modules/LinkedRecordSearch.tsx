'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface LinkedRecord { id: number; [key: string]: unknown }

interface Props {
  id?:           string
  table:         string
  labelField:    string
  subField?:     string
  placeholder?:  string
  value:         number | string
  defaultLabel?: string
  onChange:      (id: number) => void
  required?:     boolean
}

export function LinkedRecordSearch({
  id: inputId, table, labelField, subField,
  placeholder, value, defaultLabel, onChange, required,
}: Props) {
  const t = useTranslation()

  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<LinkedRecord[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selLabel, setSelLabel] = useState<string | null>(
    defaultLabel ?? (value ? null : null)
  )
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Resolve initial label when value is preset but label unknown
  useEffect(() => {
    if (!value || selLabel !== null) return
    fetch(`/api/search/${table}?id=${value}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: LinkedRecord[]) => {
        if (rows[0]) setSelLabel(String(rows[0][labelField] ?? `#${rows[0].id}`))
        else         setSelLabel(`#${value}`)
      })
      .catch(() => setSelLabel(`#${value}`))
  }, [value, table, labelField, selLabel])

  // Click-outside
  useEffect(() => {
    function h(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Debounced search
  useEffect(() => {
    if (selLabel !== null) return
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 3) { setResults([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search/${table}?q=${encodeURIComponent(query)}&label=${encodeURIComponent(labelField)}`
        )
        if (res.ok) { setResults(await res.json()); setOpen(true) }
      } finally { setLoading(false) }
    }, 320)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, table, labelField, selLabel])

  function handleSelect(rec: LinkedRecord) {
    const label = String(rec[labelField] ?? `#${rec.id}`)
    onChange(rec.id)
    setSelLabel(label)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function handleClear() {
    onChange(0)
    setSelLabel(null)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  // ── Selected state ─────────────────────────────────────────────
  if (selLabel !== null) {
    return (
      <div className="flex items-center gap-2 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="flex-1 truncate text-foreground">{selLabel}</span>
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Clear selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  // ── Search state ───────────────────────────────────────────────
  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelLabel(null) }}
          onFocus={() => query.length >= 3 && results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? t('linked.placeholder')}
          required={required && !value}
          autoComplete="off"
          className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Hint */}
      {query.length > 0 && query.length < 3 && (
        <p className="text-[11px] text-muted-foreground mt-1">{t('linked.min_chars')}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-card shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{t('linked.no_results')}</div>
          ) : (
            results.map(r => {
              const label = String(r[labelField] ?? `#${r.id}`)
              const sub   = subField ? String(r[subField] ?? '') : null
              return (
                <button
                  key={r.id}
                  type="button"
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-muted/60 text-left transition-colors"
                  onMouseDown={() => handleSelect(r)}
                >
                  <span className="font-medium flex-1 truncate">{label}</span>
                  {sub && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 border border-border/60 rounded px-1.5 py-0.5">
                      {sub}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
