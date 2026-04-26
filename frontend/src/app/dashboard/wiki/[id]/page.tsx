import Link         from 'next/link'
import { notFound } from 'next/navigation'
import {
  BookOpen, ChevronRight, Home, ArrowLeft,
  Tag, Hash, Pencil,
} from 'lucide-react'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { getToken } from '@/lib/auth'

interface WikiPage { id: number; title: string; section?: string; order?: number; contents?: string }

async function getPage(id: string): Promise<WikiPage | null> {
  if (!getToken()) return null
  try {
    const client = await getServerPostgRESTClient()
    return await client.get<WikiPage>('WikiPages', Number(id))
  } catch { return null }
}

async function getSiblings(section: string | undefined): Promise<WikiPage[]> {
  if (!getToken() || !section) return []
  try {
    const client = await getServerPostgRESTClient()
    const data   = await client.list<WikiPage>('WikiPages', { section })
    return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  } catch { return [] }
}

export default async function WikiDetailPage({ params }: { params: { id: string } }) {
  const page = await getPage(params.id)
  if (!page) notFound()

  const siblings   = await getSiblings(page.section)
  const currentIdx = siblings.findIndex(p => p.id === page.id)
  const prev = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const next = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
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
              <h1 className="page-heading truncate">{page.title}</h1>
              <nav className="breadcrumb">
                <Link href="/dashboard" className="breadcrumb-link">
                  <Home className="w-3 h-3" /><span>Accueil</span>
                </Link>
                <ChevronRight className="breadcrumb-sep" />
                <Link href="/dashboard/wiki" className="breadcrumb-link">Wiki</Link>
                <ChevronRight className="breadcrumb-sep" />
                <span className="breadcrumb-current truncate max-w-[180px]">{page.title}</span>
              </nav>
            </div>
          </div>
          <Link
            href={`/dashboard/wiki/${page.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </Link>
        </header>

        {/* Article */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {page.section && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Tag className="w-3 h-3" />{page.section}
                </span>
              )}
              {page.order != null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  <Hash className="w-3 h-3" />{page.order}
                </span>
              )}
            </div>

            {page.contents ? (
              <div className="wiki-content" dangerouslySetInnerHTML={{ __html: page.contents }} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Cette page est vide.</p>
                <Link href={`/dashboard/wiki/${page.id}/edit`} className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
                  <Pencil className="w-3 h-3" />Ajouter du contenu
                </Link>
              </div>
            )}

            {(prev || next) && (
              <nav className="mt-10 pt-6 border-t flex justify-between gap-4">
                {prev ? (
                  <Link href={`/dashboard/wiki/${prev.id}`} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="truncate max-w-[200px]">{prev.title}</span>
                  </Link>
                ) : <div />}
                {next ? (
                  <Link href={`/dashboard/wiki/${next.id}`} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                    <span className="truncate max-w-[200px]">{next.title}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : <div />}
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar TOC ───────────────────────────────────── */}
      {siblings.length > 1 && (
        <aside className="hidden lg:flex flex-col w-60 border-l bg-muted/10 overflow-y-auto flex-shrink-0">
          <div className="px-4 py-4 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{page.section || 'Pages'}</p>
          </div>
          <nav className="p-3 space-y-0.5">
            {siblings.map(p => (
              <Link
                key={p.id}
                href={`/dashboard/wiki/${p.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  p.id === page.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <span className="w-4 text-[10px] text-muted-foreground/60 flex-shrink-0 text-right">{p.order ?? ''}</span>
                <span className="truncate">{p.title}</span>
              </Link>
            ))}
          </nav>
        </aside>
      )}
    </div>
  )
}
