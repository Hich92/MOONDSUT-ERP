'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Paperclip, Upload, Trash2, Download, Eye,
  FileText, Image, FileSpreadsheet, Archive, File,
  Loader2, X,
} from 'lucide-react'
import { Button }     from '@/components/ui/button'
import { Separator }  from '@/components/ui/separator'
import { cn }         from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────
interface Attachment {
  id:            number
  original_name: string
  filename:      string
  mimetype:      string
  size:          number
  created_at:    string
}

interface AttachmentsPanelProps {
  relatedTable: string
  relatedId:    number
}

// ── Helpers ───────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

function FileIcon({ mime, className }: { mime: string; className?: string }) {
  const base = cn('flex-shrink-0', className)
  if (mime.startsWith('image/'))               return <Image         className={base} />
  if (mime === 'application/pdf')              return <FileText      className={base} />
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
                                               return <FileSpreadsheet className={base} />
  if (mime.includes('zip') || mime.includes('archive') || mime.includes('compressed'))
                                               return <Archive        className={base} />
  return <File className={base} />
}

function isPreviewable(mime: string) {
  return mime.startsWith('image/') || mime === 'application/pdf'
}

// ── Component ─────────────────────────────────────────────
export function AttachmentsPanel({ relatedTable, relatedId }: AttachmentsPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading,     setLoading]     = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [preview,     setPreview]     = useState<Attachment | null>(null)
  const [dragOver,    setDragOver]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/attachments?table=${relatedTable}&id=${relatedId}`)
      const data = await res.json()
      if (data.success) setAttachments(data.data ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [relatedTable, relatedId])

  useEffect(() => { fetchAttachments() }, [fetchAttachments])

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setUploading(true)
    setError(null)
    try {
      for (const file of list) {
        const form = new FormData()
        form.append('file',          file)
        form.append('related_table', relatedTable)
        form.append('related_id',    String(relatedId))
        const res  = await fetch('/api/attachments', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error ?? 'Erreur upload')
      }
      await fetchAttachments()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
    if (res.ok) setAttachments(prev => prev.filter(a => a.id !== id))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="record-card mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Pièces jointes
          </span>
          {attachments.length > 0 && (
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
              {attachments.length}
            </span>
          )}
        </div>
        <Button
          size="sm" variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Upload className="w-3 h-3" />}
          {uploading ? 'Upload…' : 'Ajouter'}
        </Button>
        <input
          ref={fileInputRef} type="file" multiple hidden
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed transition-colors mb-4 p-4 text-center cursor-pointer',
          dragOver
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border/50 text-muted-foreground hover:border-border hover:bg-muted/20'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mx-auto mb-1 opacity-50" />
        <p className="text-xs">Glisser-déposer ou cliquer pour ajouter</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <X className="w-3 h-3 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Chargement…</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Aucune pièce jointe</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map(att => (
            <div
              key={att.id}
              className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 hover:border-border transition-colors"
            >
              <FileIcon mime={att.mimetype} className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{att.original_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(att.size)} · {fmtDate(att.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {isPreviewable(att.mimetype) && (
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Aperçu"
                    onClick={() => setPreview(att)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Télécharger"
                  asChild
                >
                  <a href={`/api/attachments/${att.id}/file`} download={att.original_name}>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  title="Supprimer"
                  onClick={() => handleDelete(att.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <PreviewModal att={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

// ── Preview modal ─────────────────────────────────────────
function PreviewModal({ att, onClose }: { att: Attachment; onClose: () => void }) {
  const url = `/api/attachments/${att.id}/file`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon mime={att.mimetype} className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{att.original_name}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">{formatSize(att.size)}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
              <a href={url} download={att.original_name}><Download className="w-3 h-3" />Télécharger</a>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 min-h-0">
          {att.mimetype.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url} alt={att.original_name}
              className="max-w-full max-h-full object-contain p-4"
            />
          ) : att.mimetype === 'application/pdf' ? (
            <iframe
              src={url}
              className="w-full h-[70vh] border-0"
              title={att.original_name}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
