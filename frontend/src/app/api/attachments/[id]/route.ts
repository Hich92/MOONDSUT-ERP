import { NextRequest, NextResponse } from 'next/server'
import { unlink }       from 'fs/promises'
import path             from 'path'
import { db }           from '@/db'
import { attachments }  from '@/db/schema/core'
import { eq }           from 'drizzle-orm'

const UPLOAD_DIR = '/app/uploads'

type Ctx = { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  try {
    const [row] = await db.select().from(attachments).where(eq(attachments.id, id))
    if (!row) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    await db.delete(attachments).where(eq(attachments.id, id))

    await unlink(path.join(UPLOAD_DIR, row.filename)).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
