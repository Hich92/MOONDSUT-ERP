import { redirect } from 'next/navigation'
import { getToken } from '@/lib/auth'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { WikiEditor } from '@/components/wiki/WikiEditor'

interface WikiPage { section?: string }

async function getSections(): Promise<string[]> {
  try {
    const client = await getServerPostgRESTClient()
    const pages  = await client.list<WikiPage>('WikiPages')
    const set    = new Set(pages.map(p => p.section).filter(Boolean) as string[])
    return [...set].sort()
  } catch { return [] }
}

export default async function WikiNewPage() {
  if (!getToken()) redirect('/login')

  const existingSections = await getSections()

  return (
    <WikiEditor
      mode="new"
      existingSections={existingSections}
    />
  )
}
