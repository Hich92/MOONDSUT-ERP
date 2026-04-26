/**
 * Types primitifs partagés entre tous les modules MoonDust ERP.
 * Aucune dépendance externe — importer depuis n'importe quel module.
 */

// ── Primitives ────────────────────────────────────────────────────

export type TenantId   = number
export type ResourceId = number
export type ISODate    = string   // "2026-04-26"
export type ISODateTime = string  // "2026-04-26T13:00:00Z"

// ── Enveloppes de réponse API ─────────────────────────────────────

export type ApiOk<T>     = { success: true;  data: T }
export type ApiErr       = { success: false; error: string }
export type ApiResult<T> = ApiOk<T> | ApiErr

export type PageResult<T> = {
  data:  T[]
  total: number
  page:  number
  limit: number
}

// ── Enveloppe événement Activepieces ──────────────────────────────
// Aligné sur WebhookPayload dans lib/activepieces.ts

export type EventEnvelope<TEventType extends string, TPayload> = {
  event:    TEventType
  tenantId: TenantId
  record:   TPayload
  meta?:    Record<string, unknown>
}

// ── Référence de ressource générique ─────────────────────────────
// Utilisée quand un module pointe vers une ressource d'un autre module.

export type ResourceRef = {
  id:    ResourceId
  table: string
  label?: string
}

// ── Health check standard (GET /health) ──────────────────────────

export type HealthCheck = {
  module:  string
  version: string
  status:  'ok' | 'degraded' | 'down'
  db:      'ok' | 'error'
  ts:      ISODateTime
}
