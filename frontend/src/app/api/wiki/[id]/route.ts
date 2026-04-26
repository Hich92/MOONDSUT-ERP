import { NextRequest, NextResponse } from 'next/server'
import { getToken } from '@/lib/auth'
import { getServerPostgRESTClient } from '@/lib/postgrest'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getToken()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const client = await getServerPostgRESTClient()
    const page   = await client.get('WikiPages', Number(params.id))
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: page })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getToken()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { title, contents, section, order } = await req.json()

  if (title    !== undefined && !title?.trim())    return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  if (contents !== undefined && !contents?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })

  const payload: Record<string, unknown> = {}
  if (title    !== undefined) payload.title    = title.trim()
  if (contents !== undefined) payload.contents = contents.trim()
  if (section  !== undefined) payload.section  = section?.trim() || null
  if (order    !== undefined) payload.order     = order !== '' ? Number(order) : null

  try {
    const client = await getServerPostgRESTClient()
    await client.update('WikiPages', Number(params.id), payload)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getToken()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const client = await getServerPostgRESTClient()
    await client.delete('WikiPages', Number(params.id))
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
