import Link          from 'next/link'
import { BookOpen, Plus, ChevronRight, Home, FileText, Pencil } from 'lucide-react'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { getToken } from "@/lib/auth"


interface WikiPage { id: number; title: string; section?: string; order?: number; contents?: string }

async function getWikiPages(): Promise<WikiPage[]> {
  if (!getToken()) return []
  try {
    const client = await getServerPostgRESTClient()
    const data   = await client.list<WikiPage>("WikiPages")
    return data.sort((a, b) => {
      const sa = a.section ?? "", sb = b.section ?? ""
      if (sa !== sb) return sa.localeCompare(sb)
      return (a.order ?? 0) - (b.order ?? 0)
    })
  } catch { return [] }
}

function groupBySection(pages: WikiPage[]): Map<string, WikiPage[]> {
  const map = new Map<string, WikiPage[]>()
  for (const p of pages) {
    const key = p.section || 'Général'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return map
}

export default async function WikiListPage() {
  const pages    = await getWikiPages()
  const sections = groupBySection(pages)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="page-header">
        <div className="flex items-center gap-2 min-w-0">
          <div className="brand-icon flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="page-heading">Wiki</h1>
            <nav className="breadcrumb">
              <Link href="/dashboard" className="breadcrumb-link">
                <Home className="w-3 h-3" /><span>Accueil</span>
              </Link>
              <ChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">Wiki</span>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/dashboard/wiki/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle page
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aucune page wiki pour l&apos;instant.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Créez votre première page pour partager des connaissances avec votre équipe.
              </p>
            </div>
            <Link
              href="/dashboard/wiki/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer la première page
            </Link>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl">
            {Array.from(sections.entries()).map(([section, sectionPages]) => (
              <section key={section}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{section}</h2>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{sectionPages.length} page{sectionPages.length > 1 ? 's' : ''}</span>
                </div>

                {/* Pages grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sectionPages.map(page => (
                    <div key={page.id} className="group relative flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <Link href={`/dashboard/wiki/${page.id}`} className="absolute inset-0 rounded-xl" aria-label={page.title} />
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {page.title}
                        </p>
                        {page.order != null && (
                          <p className="text-xs text-muted-foreground mt-0.5">#{page.order}</p>
                        )}
                      </div>
                      <Link
                        href={`/dashboard/wiki/${page.id}/edit`}
                        className="relative z-10 flex-shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        aria-label="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
