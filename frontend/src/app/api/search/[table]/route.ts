import { NextRequest, NextResponse } from 'next/server'
import { getServerPostgRESTClient } from '@/lib/postgrest'

export async function GET(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const { searchParams } = req.nextUrl
  const q     = searchParams.get('q') ?? ''
  const label = searchParams.get('label') ?? 'name'
  const byId  = searchParams.get('id')

  try {
    const client = await getServerPostgRESTClient()

    if (byId) {
      const record = await client.get(params.table, Number(byId))
      return NextResponse.json(record ? [record] : [])
    }

    if (q.length < 3) return NextResponse.json([])

    // Recherche multi-champs côté serveur via PostgREST `or` + `ilike`
    const pattern = `ilike.*${q}*`
    const orFields = [label, 'name', 'title', 'email', 'invoice_number', 'reference']
      .map(f => `${f}.${pattern}`)
      .join(',')

    const results = await client.list(params.table, { or: `(${orFields})`, limit: '10' })
    return NextResponse.json(results)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
