import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const num    = req.nextUrl.searchParams.get('num')
  const random = req.nextUrl.searchParams.get('random')

  try {
    let url: string

    if (random === '1') {
      // Fetch latest to know max num, then pick random
      const latest = await fetch('https://xkcd.com/info.0.json', { next: { revalidate: 3600 } })
      const latestData = await latest.json()
      const max = latestData.num as number
      const pick = Math.floor(Math.random() * (max - 1)) + 1
      url = `https://xkcd.com/${pick}/info.0.json`
    } else if (num) {
      url = `https://xkcd.com/${num}/info.0.json`
    } else {
      url = 'https://xkcd.com/info.0.json'
    }

    const res  = await fetch(url, { next: { revalidate: random === '1' ? 0 : 3600 } })
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
