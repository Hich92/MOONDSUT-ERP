'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Save, ArrowLeft, Eye, Code2, Trash2,
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Link2, Code, Minus, AlertTriangle,
  Loader2,
} from 'lucide-react'

// ── Markdown → HTML ───────────────────────────────────────────────
function escHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineFormat(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

export function markdownToHtml(md: string): string {
  const lines  = md.split('\n')
  const out: string[] = []
  let inCode  = false
  let codeBuf: string[] = []
  let inUl    = false
  let inOl    = false

  function closeList() {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }

  for (const line of lines) {
    // Fenced code blocks
    if (line.startsWith('```')) {
      if (!inCode) {
        closeList()
        inCode = true
        codeBuf = []
      } else {
        out.push(`<pre><code>${escHtml(codeBuf.join('\n'))}</code></pre>`)
        inCode = false
      }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }

    // HR
    if (/^---+$/.test(line.trim())) { closeList(); out.push('<hr />'); continue }

    // Headings
    const hm = line.match(/^(#{1,4})\s+(.+)$/)
    if (hm) {
      closeList()
      out.push(`<h${hm[1].length}>${inlineFormat(hm[2])}</h${hm[1].length}>`)
      continue
    }

    // Unordered list
    const ulm = line.match(/^[-*]\s+(.+)$/)
    if (ulm) {
      if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false }; out.push('<ul>'); inUl = true }
      out.push(`<li>${inlineFormat(ulm[1])}</li>`)
      continue
    }

    // Ordered list
    const olm = line.match(/^\d+\.\s+(.+)$/)
    if (olm) {
      if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false }; out.push('<ol>'); inOl = true }
      out.push(`<li>${inlineFormat(olm[1])}</li>`)
      continue
    }

    // Blank line
    if (line.trim() === '') { closeList(); continue }

    // Paragraph
    closeList()
    out.push(`<p>${inlineFormat(line)}</p>`)
  }

  if (inCode) out.push(`<pre><code>${escHtml(codeBuf.join('\n'))}</code></pre>`)
  closeList()
  return out.join('\n')
}

// ── Types ─────────────────────────────────────────────────────────

export interface WikiEditorProps {
  mode:       'new' | 'edit'
  initialId?: number
  initial?: {
    title:    string
    section:  string
    order:    string
    contents: string
  }
  existingSections: string[]
}

// ── Component ─────────────────────────────────────────────────────

export function WikiEditor({ mode, initialId, initial, existingSections }: WikiEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title,   setTitle]   = useState(initial?.title    ?? '')
  const [section, setSection] = useState(initial?.section  ?? '')
  const [order,   setOrder]   = useState(initial?.order    ?? '')
  const [content, setContent] = useState(initial?.contents ?? '')
  const [tab,     setTab]     = useState<'write' | 'preview'>('write')
  const [error,   setError]   = useState<string | null>(null)
  const [showDel, setShowDel] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Toolbar insert helpers ─────────────────────────────────────
  const insert = useCallback((before: string, after = '', placeholder = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = content.slice(start, end) || placeholder
    const next  = content.slice(0, start) + before + sel + after + content.slice(end)
    setContent(next)
    setTimeout(() => {
      ta.focus()
      const cursor = start + before.length + sel.length
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }, [content])

  const insertLine = useCallback((prefix: string, placeholder = 'texte') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = content.lastIndexOf('\n', start - 1) + 1
    const line = content.slice(lineStart, ta.selectionEnd)
    const newLine = line.trim() ? `${prefix} ${line}` : `${prefix} ${placeholder}`
    const next = content.slice(0, lineStart) + newLine + content.slice(ta.selectionEnd)
    setContent(next)
    setTimeout(() => ta.focus(), 0)
  }, [content])

  // ── Save ───────────────────────────────────────────────────────
  async function handleSave() {
    setError(null)
    if (!title.trim()) { setError('Le titre est requis.'); return }
    if (!content.trim()) { setError('Le contenu est requis.'); return }

    const html = markdownToHtml(content)

    const url    = mode === 'new' ? '/api/wiki' : `/api/wiki/${initialId}`
    const method = mode === 'new' ? 'POST'      : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:    title.trim(),
        contents: html,
        section:  section.trim() || null,
        order:    order !== '' ? Number(order) : null,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error ?? 'Erreur lors de la sauvegarde'); return }

    const id = mode === 'new' ? (data.data?.id ?? data.id) : initialId
    startTransition(() => router.push(id ? `/dashboard/wiki/${id}` : '/dashboard/wiki'))
    router.refresh()
  }

  // ── Delete ─────────────────────────────────────────────────────
  async function handleDelete() {
    if (!initialId) return
    const res = await fetch(`/api/wiki/${initialId}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Erreur suppression')
      setShowDel(false)
      return
    }
    startTransition(() => router.push('/dashboard/wiki'))
    router.refresh()
  }

  const preview = markdownToHtml(content)

  // ── Toolbar definition ─────────────────────────────────────────
  const toolbar = [
    { icon: Bold,         title: 'Gras',       action: () => insert('**', '**', 'texte') },
    { icon: Italic,       title: 'Italique',   action: () => insert('*', '*', 'texte') },
    { icon: Code,         title: 'Code inline', action: () => insert('`', '`', 'code') },
    null,
    { icon: Heading1,     title: 'Titre 1',    action: () => insertLine('#') },
    { icon: Heading2,     title: 'Titre 2',    action: () => insertLine('##') },
    { icon: Heading3,     title: 'Titre 3',    action: () => insertLine('###') },
    null,
    { icon: List,         title: 'Liste',      action: () => insertLine('-') },
    { icon: ListOrdered,  title: 'Liste num.', action: () => insertLine('1.') },
    { icon: Minus,        title: 'Séparateur', action: () => { insert('\n---\n', '') } },
    null,
    { icon: Link2,        title: 'Lien',       action: () => insert('[', '](https://)', 'texte') },
    { icon: Code2,        title: 'Bloc code',  action: () => insert('\n```\n', '\n```\n', 'code') },
  ] as const

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="page-header">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard/wiki"
            className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="brand-icon flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="page-heading">
              {mode === 'new' ? 'Nouvelle page' : 'Modifier la page'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {mode === 'edit' && !showDel && (
            <button
              onClick={() => setShowDel(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />}
            {mode === 'new' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </header>

      {/* ── Delete confirm ──────────────────────────────────── */}
      {showDel && (
        <div className="flex items-center gap-3 px-6 py-3 bg-destructive/5 border-b border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive flex-1">
            Supprimer <strong>«&nbsp;{title}&nbsp;»</strong> définitivement ?
          </p>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
          >
            Confirmer
          </button>
          <button
            onClick={() => setShowDel(false)}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Meta fields ─────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b">
        <div className="max-w-3xl grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          {/* Title */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Titre <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre de la page"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Section</label>
            <input
              list="section-list"
              value={section}
              onChange={e => setSection(e.target.value)}
              placeholder="ex: Onboarding"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <datalist id="section-list">
              {existingSections.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Order */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordre</label>
            <input
              type="number"
              value={order}
              onChange={e => setOrder(e.target.value)}
              placeholder="ex: 1"
              min={0}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* ── Editor area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">

          {/* Tabs + toolbar */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setTab('write')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === 'write'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />Éditeur
              </button>
              <button
                onClick={() => setTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === 'preview'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />Aperçu
              </button>
            </div>

            {tab === 'write' && (
              <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-1 flex-wrap">
                {toolbar.map((btn, i) =>
                  btn === null ? (
                    <div key={`sep-${i}`} className="w-px h-5 bg-border mx-1" />
                  ) : (
                    <button
                      key={btn.title}
                      title={btn.title}
                      onClick={btn.action}
                      className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                    >
                      <btn.icon className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Write / Preview pane */}
          <div className="flex-1 min-h-0 rounded-xl border overflow-hidden">
            {tab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`# Titre de section\n\nCommencez à écrire en **Markdown**...\n\n## Sous-section\n\nTexte, *italique*, **gras**, \`code\`.\n\n- Liste item 1\n- Liste item 2`}
                className="w-full h-full resize-none p-5 font-mono text-sm leading-relaxed bg-background focus:outline-none"
                spellCheck={false}
              />
            ) : (
              <div className="h-full overflow-y-auto p-6">
                {content.trim() ? (
                  <div
                    className="wiki-content max-w-3xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <Eye className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Rien à prévisualiser — écrivez d&apos;abord du contenu.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Markdown supporté : <code className="bg-muted px-1 rounded text-[10px]"># Titre</code>{' '}
            <code className="bg-muted px-1 rounded text-[10px]">**gras**</code>{' '}
            <code className="bg-muted px-1 rounded text-[10px]">*italique*</code>{' '}
            <code className="bg-muted px-1 rounded text-[10px]">`code`</code>{' '}
            <code className="bg-muted px-1 rounded text-[10px]">- liste</code>{' '}
            <code className="bg-muted px-1 rounded text-[10px]">[lien](url)</code>
          </p>
        </div>
      </div>
    </div>
  )
}
