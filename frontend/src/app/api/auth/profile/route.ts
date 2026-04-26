import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq, and } from 'drizzle-orm'
import { getToken, getUserId } from '@/lib/auth'
import { verifySession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const token  = getToken()
  const userId = getUserId()
  if (!token || !userId) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const session = await verifySession(token)
  if (!session) return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })

  const { displayName, currentPassword, newPassword } = await req.json()

  const [user] = await db.select().from(erpUsers).where(eq(erpUsers.id, userId))
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })

  try {
    if (displayName !== undefined) {
      await db.update(erpUsers).set({ name: displayName }).where(eq(erpUsers.id, userId))
    }

    if (newPassword && currentPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' }, { status: 400 })
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 400 })
      }
      const hash = await bcrypt.hash(newPassword, 12)
      await db.update(erpUsers).set({ passwordHash: hash }).where(eq(erpUsers.id, userId))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 })
  }
}
