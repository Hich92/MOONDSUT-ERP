import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { tenants, erpUsers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'

const BASE_DOMAIN = 'moondust.cloud'

const sanitize = (s: string) => s.replace(/[^a-z0-9]/g, '').substring(0, 32)
const SLUG_RE   = /^[a-z0-9]{3,32}$/

const RESERVED = new Set([
  'portal', 'api', 'www', 'mail', 'smtp', 'ftp', 'admin', 'app',
  'login', 'signup', 'auth', 'public', 'demo', 'test', 'staging',
  'dev', 'prod', 'static', 'cdn', 'assets', 'support', 'help',
  'blog', 'docs', 'status', 'health', 'metrics', 'erp', 'crm',
])

export async function POST(req: NextRequest) {
  try {
    const { slug: rawSlug, name, email, password } = await req.json() as {
      slug: string; name: string; email: string; password: string
    }

    const slug = sanitize(rawSlug?.toLowerCase() ?? '')

    if (!slug || !email || !password) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
    }
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'Sous-domaine invalide.' }, { status: 400 })
    }
    if (RESERVED.has(slug)) {
      return NextResponse.json({ error: 'Ce nom est réservé.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum).' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Vérifier disponibilité slug
    const [existingTenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug))
    if (existingTenant) {
      return NextResponse.json({ error: 'Ce sous-domaine est déjà pris.' }, { status: 409 })
    }

    // Créer le tenant
    const [newTenant] = await db.insert(tenants).values({
      slug,
      name: name?.trim() || email.split('@')[0],
      plan:   'trial',
      status: 'active',
    }).returning({ id: tenants.id })

    // Créer l'utilisateur admin du tenant
    const passwordHash = await bcrypt.hash(password, 12)
    await db.insert(erpUsers).values({
      email:        normalizedEmail,
      name:         name?.trim() || null,
      passwordHash,
      roleId:       1,       // admin du tenant
      tenantId:     newTenant.id,
    })

    return NextResponse.json({
      success: true,
      url:     `https://${slug}.${BASE_DOMAIN}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
