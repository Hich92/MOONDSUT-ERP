import { NextRequest, NextResponse } from 'next/server'
import { getToken } from '@/lib/auth'
import { callFlow } from '@/lib/activepieces'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_MODEL   = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
}

export interface ChatResponse {
  reply: string
  model: string
}

const SYSTEM_PROMPT = `Tu es MoonDust, un assistant IA intégré dans le portail ERP MoonDust.
Tu aides les utilisateurs à naviguer dans l'ERP, à comprendre les données, et à effectuer des actions.
Modules disponibles : Partenaires, Opportunités, Contrats, Projets, Tâches, Factures, Achats, Wiki.
Réponds en français, de manière concise et professionnelle.
Si l'utilisateur demande une action (créer, modifier, chercher), guide-le vers la bonne page.
Ne génère jamais de données fictives présentées comme réelles.`

export async function POST(req: NextRequest) {
  const token = getToken()
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const { messages, model } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
  }

  // Inject system prompt as first message if not already present
  const fullMessages: ChatMessage[] = messages[0]?.role === 'system'
    ? messages
    : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

  const groqModel = model || GROQ_MODEL

  // ── Délégation AP : le flow gère Groq et retourne { reply, model } ──
  const apResult = await callFlow<ChatResponse>('CHAT', {
    messages: fullMessages,
    model:    groqModel,
  })
  if (apResult) return NextResponse.json(apResult)

  // ── Fallback direct Groq tant que le flow AP n'est pas configuré ──
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:       groqModel,
      messages:    fullMessages,
      temperature: 0.7,
      max_tokens:  2048,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.text().catch(() => 'Groq error')
    console.error('[chat/route] Groq error:', groqRes.status, err)
    return NextResponse.json({ error: 'Erreur LLM' }, { status: 502 })
  }

  const groqData = await groqRes.json()
  const reply    = groqData.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ reply, model: groqData.model } satisfies ChatResponse)
}
