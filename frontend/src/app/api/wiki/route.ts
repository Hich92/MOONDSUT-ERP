import { NextRequest, NextResponse } from 'next/server'
import { getToken, getUserId } from '@/lib/auth'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { getTenantIdFromRequest } from '@/db/tenant'

export async function GET(req: NextRequest) {
  if (!getToken()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const section = req.nextUrl.searchParams.get('section')
  const filters: Record<string, string> = {}
  if (section) filters.section = section

  try {
    const client = await getServerPostgRESTClient()
    const data   = await client.list('WikiPages', Object.keys(filters).length ? filters : undefined)
    data.sort((a, b) => {
      const sa = String(a.section ?? ''), sb = String(b.section ?? '')
      if (sa !== sb) return sa.localeCompare(sb)
      return Number(a.order ?? 0) - Number(b.order ?? 0)
    })
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!getToken()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = await getTenantIdFromRequest()
  const userId   = getUserId()

  const { title, contents, section, order } = await req.json()
  if (!title?.trim())    return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  if (!contents?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })

  const payload: Record<string, unknown> = {
    title:               title.trim(),
    contents:            contents.trim(),
    tenant_id:           tenantId,
    created_by_user_id:  userId,
  }
  if (section?.trim()) payload.section = section.trim()
  if (order != null && order !== '') payload.order = Number(order)

  try {
    const client = await getServerPostgRESTClient()
    const result = await client.create('WikiPages', payload)
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
