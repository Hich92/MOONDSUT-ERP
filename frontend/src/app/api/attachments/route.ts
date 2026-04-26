import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir }  from 'fs/promises'
import path                  from 'path'
import crypto                from 'crypto'
import { db }                from '@/db'
import { attachments }       from '@/db/schema/core'
import { eq, and }           from 'drizzle-orm'

const UPLOAD_DIR = '/app/uploads'

export async function GET(req: NextRequest) {
  const table   = req.nextUrl.searchParams.get('table')
  const idParam = req.nextUrl.searchParams.get('id')

  try {
    if (!table) return NextResponse.json({ data: [] })

    const conditions = idParam
      ? and(eq(attachments.relatedTable, table), eq(attachments.relatedId, Number(idParam)))
      : eq(attachments.relatedTable, table)

    const rows = await db.select().from(attachments).where(conditions)

    if (idParam) {
      return NextResponse.json({ success: true, data: rows })
    }
    const ids = [...new Set(rows.map(r => r.relatedId))]
    return NextResponse.json({ success: true, ids })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const form         = await req.formData()
    const file         = form.get('file') as File | null
    const relatedTable = form.get('related_table') as string | null
    const relatedId    = Number(form.get('related_id'))

    if (!file)         return NextResponse.json({ error: 'Fichier manquant' },    { status: 400 })
    if (!relatedTable) return NextResponse.json({ error: 'Table manquante' },     { status: 400 })
    if (!relatedId)    return NextResponse.json({ error: 'related_id manquant' }, { status: 400 })

    const ext      = path.extname(file.name).toLowerCase() || ''
    const uuid     = crypto.randomUUID()
    const filename = `${uuid}${ext}`
    const filePath = path.join(UPLOAD_DIR, filename)

    await mkdir(UPLOAD_DIR, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const [row] = await db.insert(attachments).values({
      relatedTable,
      relatedId,
      filename,
      originalName: file.name,
      mimetype:     file.type || 'application/octet-stream',
      size:         file.size,
    }).returning()

    return NextResponse.json({ success: true, data: row })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
