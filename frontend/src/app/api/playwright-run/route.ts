import { NextResponse } from 'next/server'

const PLAYWRIGHT_URL = 'http://playwright:3001'

export async function POST() {
  try {
    const res = await fetch(`${PLAYWRIGHT_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(180_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur connexion Playwright'
    return NextResponse.json(
      { total: 0, ok: 0, errors: 1, steps: [{ step: 'playwright_connect', status: 'error', message }] },
      { status: 503 }
    )
  }
}
