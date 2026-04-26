import { NextRequest, NextResponse } from 'next/server'
import { readFile }     from 'fs/promises'
import path             from 'path'
import { db }           from '@/db'
import { attachments }  from '@/db/schema/core'
import { eq }           from 'drizzle-orm'

const UPLOAD_DIR = '/app/uploads'

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  try {
    const [row] = await db.select().from(attachments).where(eq(attachments.id, id))
    if (!row) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const filePath = path.join(UPLOAD_DIR, row.filename)
    const buffer   = await readFile(filePath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        row.mimetype,
        'Content-Disposition': `inline; filename="${encodeURIComponent(row.originalName)}"`,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'private, max-age=3600',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
