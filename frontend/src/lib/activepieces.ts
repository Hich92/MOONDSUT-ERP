/**
 * ══════════════════════════════════════════════════════════
 *  Activepieces Client
 *  ─────────────────────────────────────────────────────────
 *  Utilisé côté serveur (Server Actions, API routes) pour :
 *    1. Déclencher un flow via webhook
 *    2. Appeler l'API Activepieces (list flows, runs, etc.)
 *
 *  Variables d'env requises :
 *    ACTIVEPIECES_INTERNAL_URL   → http://activepieces:80  (Docker interne)
 *    NEXT_PUBLIC_ACTIVEPIECES_URL → https://automate.moondust.cloud  (public)
 *    AP_API_KEY                  → clé API plateforme Activepieces
 * ══════════════════════════════════════════════════════════
 */

const INTERNAL_URL = process.env.ACTIVEPIECES_INTERNAL_URL || 'http://activepieces:80'
const API_KEY      = process.env.AP_API_KEY || ''

// ── Types ────────────────────────────────────────────────

export interface WebhookPayload {
  event: string
  table?: string
  record?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export interface ActivepiecesFlow {
  id: string
  displayName: string
  status: 'ENABLED' | 'DISABLED'
  publishedVersionId?: string
}

export interface ActivepiecesRun {
  id: string
  flowId: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT'
  startTime: string
  finishTime?: string
}

// ── Webhook trigger ──────────────────────────────────────

/**
 * Déclenche un flow Activepieces via webhook.
 *
 * @param webhookPath - chemin relatif du webhook, ex: "/api/v1/webhooks/abc123"
 * @param payload     - données envoyées au flow
 *
 * Le webhookPath complet est affiché dans Activepieces :
 *   Flow → Trigger → Webhook → URL complète
 */
export async function triggerWebhook(
  webhookPath: string,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${INTERNAL_URL}${webhookPath}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { success: false, error: `Webhook ${res.status}: ${text}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── API Activepieces (plateforme) ────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${INTERNAL_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Activepieces API ${res.status} ${path}`)
  }
  return res.json() as Promise<T>
}

export async function listFlows(projectId: string): Promise<ActivepiecesFlow[]> {
  const data = await apiFetch<{ data: ActivepiecesFlow[] }>(
    `/api/v1/flows?projectId=${projectId}`
  )
  return data.data
}

export async function getFlowRuns(flowId: string): Promise<ActivepiecesRun[]> {
  const data = await apiFetch<{ data: ActivepiecesRun[] }>(
    `/api/v1/flow-runs?flowId=${flowId}`
  )
  return data.data
}

// ── Flows synchrones (request/response) ─────────────────
//
// Pattern : Next.js POST → AP webhook → AP traite → AP retourne JSON
// Chaque flow est identifié par une clé et une var d'env contenant l'URL webhook.

export const FLOW_WEBHOOKS = {
  CHAT:   process.env.AP_CHAT_FLOW_WEBHOOK   || '',
  SIRENE: process.env.AP_SIRENE_FLOW_WEBHOOK  || '',
} as const

export type FlowKey = keyof typeof FLOW_WEBHOOKS

/**
 * Appelle un flow Activepieces de façon synchrone et attend sa réponse JSON.
 * Retourne null si le flow n'est pas configuré (URL vide) ou si l'appel échoue.
 */
export async function callFlow<T = unknown>(
  flowKey: FlowKey,
  payload: Record<string, unknown>
): Promise<T | null> {
  const url = FLOW_WEBHOOKS[flowKey]
  if (!url) return null

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`[AP] callFlow(${flowKey}) ${res.status}`)
      return null
    }
    return res.json() as Promise<T>
  } catch (err) {
    console.error(`[AP] callFlow(${flowKey})`, err)
    return null
  }
}

// ── Helpers métier MoonDust ──────────────────────────────
//
// Ces fonctions simplifient les appels depuis les Server Actions.
// Chaque helper correspond à un webhook configuré dans Activepieces.
// Stocker les paths dans des constantes env permet de changer le flow
// sans modifier le code Next.js.

export const WEBHOOK_PATHS = {
  // Déclencheurs CRM
  OPPORTUNITY_CREATED:  process.env.AP_WEBHOOK_OPPORTUNITY_CREATED  || '',
  OPPORTUNITY_WON:      process.env.AP_WEBHOOK_OPPORTUNITY_WON      || '',
  CONTRACT_SIGNED:      process.env.AP_WEBHOOK_CONTRACT_SIGNED      || '',
  // Déclencheurs projets
  PROJECT_CREATED:      process.env.AP_WEBHOOK_PROJECT_CREATED      || '',
  TASK_COMPLETED:       process.env.AP_WEBHOOK_TASK_COMPLETED        || '',
  // Déclencheurs achats
  INVOICE_DUE:          process.env.AP_WEBHOOK_INVOICE_DUE          || '',
  PURCHASE_ORDER_SENT:  process.env.AP_WEBHOOK_PURCHASE_ORDER_SENT  || '',
  // Déclencheur générique (table + event)
  RECORD_CHANGED:       process.env.AP_WEBHOOK_RECORD_CHANGED        || '',
} as const

export type WebhookEvent = keyof typeof WEBHOOK_PATHS

/**
 * Envoie un événement métier à Activepieces.
 * Si le webhook n'est pas encore configuré (path vide), ignore silencieusement.
 */
export async function emitEvent(
  event: WebhookEvent,
  record: Record<string, unknown>,
  meta?: Record<string, unknown>
): Promise<void> {
  const path = WEBHOOK_PATHS[event]
  if (!path) return

  const result = await triggerWebhook(path, { event, record, meta })
  if (!result.success) {
    console.error(`[Activepieces] emitEvent(${event}) failed:`, result.error)
  }
}
