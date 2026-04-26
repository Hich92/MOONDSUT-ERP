import { NextResponse } from 'next/server'
import { getToken } from '@/lib/auth'

// Saltcorn __history tables supprimées — historique non disponible dans cette version.
export async function GET() {
  if (!getToken()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json({ success: true, data: [] })
}
