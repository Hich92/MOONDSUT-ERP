import { redirect, notFound } from 'next/navigation'
import { getToken } from '@/lib/auth'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { WikiEditor } from '@/components/wiki/WikiEditor'

interface WikiPage {
  id: number
  title: string
  section?: string
  order?: number
  contents?: string
}

async function getPage(id: string): Promise<WikiPage | null> {
  try {
    const client = await getServerPostgRESTClient()
    const rows   = await client.list<WikiPage>('WikiPages', { id })
    return rows[0] ?? null
  } catch { return null }
}

async function getSections(): Promise<string[]> {
  try {
    const client = await getServerPostgRESTClient()
    const pages  = await client.list<WikiPage>('WikiPages')
    const set    = new Set(pages.map(p => p.section).filter(Boolean) as string[])
    return [...set].sort()
  } catch { return [] }
}

export default async function WikiEditPage({ params }: { params: { id: string } }) {
  if (!getToken()) redirect('/login')

  const [page, existingSections] = await Promise.all([
    getPage(params.id),
    getSections(),
  ])

  if (!page) notFound()

  return (
    <WikiEditor
      mode="edit"
      initialId={page.id}
      initial={{
        title:    page.title,
        section:  page.section ?? '',
        order:    page.order != null ? String(page.order) : '',
        contents: page.contents ?? '',
      }}
      existingSections={existingSections}
    />
  )
}
