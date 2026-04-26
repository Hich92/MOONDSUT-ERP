import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'
import { verifyResetToken } from '@/lib/reset-token'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json() as { token?: string; password?: string }

  if (!token || !password) {
    return NextResponse.json({ error: 'Token et mot de passe requis.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' }, { status: 400 })
  }

  const payload = verifyResetToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Lien invalide ou expiré. Veuillez recommencer.' }, { status: 400 })
  }

  const [user] = await db.select({ id: erpUsers.id })
    .from(erpUsers).where(eq(erpUsers.email, payload.email.toLowerCase()))

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
  }

  const hash = await bcrypt.hash(password, 12)
  await db.update(erpUsers).set({ passwordHash: hash }).where(eq(erpUsers.id, user.id))

  return NextResponse.json({ success: true })
}
