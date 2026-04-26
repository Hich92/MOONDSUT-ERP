import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tenants } from '@/db/schema/core'
import { eq } from 'drizzle-orm'

const RESERVED = new Set([
  'portal', 'api', 'www', 'mail', 'smtp', 'ftp', 'admin', 'app',
  'login', 'signup', 'auth', 'public', 'demo', 'test', 'staging',
  'dev', 'prod', 'static', 'cdn', 'assets', 'support', 'help',
  'blog', 'docs', 'status', 'health', 'metrics', 'erp', 'crm',
])

const sanitize = (s: string) => s.replace(/[^a-z0-9]/g, '').substring(0, 32)
const SLUG_RE  = /^[a-z0-9]{3,32}$/

export async function GET(req: NextRequest) {
  const raw  = req.nextUrl.searchParams.get('slug')?.toLowerCase().trim() ?? ''
  const slug = sanitize(raw)

  if (!slug)            return NextResponse.json({ available: false, error: 'Slug requis.' })
  if (!SLUG_RE.test(slug)) return NextResponse.json({ available: false, error: 'Le sous-domaine doit contenir 3 à 32 caractères (lettres et chiffres uniquement).' })
  if (RESERVED.has(slug)) return NextResponse.json({ available: false, error: 'Ce nom est réservé.' })

  try {
    const [existing] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug))
    return NextResponse.json({ available: !existing })
  } catch {
    return NextResponse.json({ available: false, error: 'Impossible de vérifier la disponibilité.' }, { status: 500 })
  }
}
