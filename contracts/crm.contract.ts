/**
 * CRM MODULE — Contrat de communication v0.1.2
 * Responsabilité : partenaires, opportunités, activités.
 */

import type { TenantId, ResourceId, ISODate, ISODateTime, EventEnvelope } from './_schema'

// ═══════════════════════════════════════════════════════════════════
// 1. API REST exposée
// ═══════════════════════════════════════════════════════════════════

export const CRM_API = {
  // Partners
  listPartners:        'GET /api/records/partners',
  getPartner:          'GET /api/records/partners/:id',
  createPartner:       'POST /api/records/partners',
  updatePartner:       'PATCH /api/records/partners/:id',
  deletePartner:       'DELETE /api/records/partners/:id',
  searchPartners:      'GET /api/search/partners',

  // Opportunities
  listOpportunities:   'GET /api/records/opportunities',
  getOpportunity:      'GET /api/records/opportunities/:id',
  createOpportunity:   'POST /api/records/opportunities',
  updateOpportunity:   'PATCH /api/records/opportunities/:id',

  // Activities (polymorphic)
  listActivities:      'GET /api/activities',
  createActivity:      'POST /api/records/activities',
  updateActivity:      'PATCH /api/records/activities/:id',
  deleteActivity:      'DELETE /api/records/activities/:id',

  // SIRENE (via Activepieces ou fallback direct)
  searchSirene:        'GET /api/sirene',
} as const

// ═══════════════════════════════════════════════════════════════════
// 2. Types de données publics
// ═══════════════════════════════════════════════════════════════════

export type PartnerType =
  | 'contact' | 'prospect' | 'client'
  | 'ex-client' | 'fournisseur' | 'partenaire'

export type PartnerRecord = {
  id:        ResourceId
  tenantId:  TenantId
  isCompany: boolean
  name:      string
  firstName: string | null
  parentId:  ResourceId | null       // société parente (self-ref)
  type:      PartnerType
  email:     string | null
  phone:     string | null
  siren:     string | null
  siret:     string | null
  city:      string | null
  country:   string | null
  createdAt: ISODateTime | null
}

export type OpportunityStage =
  | 'lead' | 'qualification' | 'proposition'
  | 'negotiation' | 'won' | 'lost'

export type OpportunityRecord = {
  id:          ResourceId
  tenantId:    TenantId
  name:        string
  partnerId:   ResourceId | null
  stage:       OpportunityStage | null
  probability: number | null   // 0–100
  dealValue:   string | null   // numeric → string en JSON
  closingDate: ISODate | null
}

export type ActivityType   = 'Note' | 'Action'
export type ActivityStatus = 'open' | 'done' | 'cancelled'

export type ActivityRecord = {
  id:           ResourceId
  tenantId:     TenantId
  type:         ActivityType
  content:      string | null
  status:       ActivityStatus | null
  dueDate:      ISODate | null
  relatedTable: string | null
  relatedId:    ResourceId | null
  createdAt:    ISODateTime | null
}

// ═══════════════════════════════════════════════════════════════════
// 3. Événements ÉMIS (clés = WEBHOOK_PATHS dans lib/activepieces.ts)
// ═══════════════════════════════════════════════════════════════════

export type OpportunityCreatedPayload = {
  id:        ResourceId
  tenantId:  TenantId
  name:      string
  partnerId: ResourceId | null
  stage:     OpportunityStage | null
}

export type OpportunityWonPayload = {
  id:         ResourceId
  tenantId:   TenantId
  name:       string
  partnerId:  ResourceId | null
  dealValue:  string | null
  closingDate: ISODate | null
}

export type PartnerCreatedPayload = {
  id:        ResourceId
  tenantId:  TenantId
  name:      string
  type:      PartnerType
  isCompany: boolean
}

export type CrmEmittedEvents =
  | EventEnvelope<'OPPORTUNITY_CREATED', OpportunityCreatedPayload>
  | EventEnvelope<'OPPORTUNITY_WON',     OpportunityWonPayload>
  | EventEnvelope<'PARTNER_CREATED',     PartnerCreatedPayload>

// ═══════════════════════════════════════════════════════════════════
// 4. Événements CONSOMMÉS (flows AP → webhook → /api/*)
// ═══════════════════════════════════════════════════════════════════

// Quand un contrat est signé, le CRM peut qualifier l'opportunité liée.
import type { ContractSignedPayload } from './sales.contract'

export type CrmConsumedEvents =
  | EventEnvelope<'CONTRACT_SIGNED', ContractSignedPayload>
