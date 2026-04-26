import { NextResponse } from 'next/server'
import { getUserId, getUserRole } from '@/lib/auth'

// Retourne l'identité du user courant depuis les cookies (set au login)
export async function GET() {
  const id      = getUserId()
  const role_id = getUserRole()
  return NextResponse.json({ id, role_id })
}
