import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { erpUsers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'
import { createResetToken } from '@/lib/reset-token'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string }
  if (!email) return NextResponse.json({ error: 'Email requis.' }, { status: 400 })

  // Toujours retourner succès — évite l'énumération d'emails
  const res = NextResponse.json({ success: true })

  try {
    const [user] = await db.select({ id: erpUsers.id, email: erpUsers.email })
      .from(erpUsers).where(eq(erpUsers.email, email.toLowerCase().trim()))

    if (!user) return res

    const token = createResetToken(user.email)
    await sendPasswordResetEmail(user.email, token)
  } catch (err) {
    console.error('[forgot-password]', err)
  }

  return res
}
