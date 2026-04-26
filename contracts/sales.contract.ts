/**
 * SALES MODULE — Contrat de communication v0.1.2
 * Responsabilité : contrats clients, factures.
 */

import type { TenantId, ResourceId, ISODate, ISODateTime, EventEnvelope } from './_schema'

// ═══════════════════════════════════════════════════════════════════
// 1. API REST exposée
// ═══════════════════════════════════════════════════════════════════

export const SALES_API = {
  // Contracts
  listContracts:   'GET /api/records/contracts',
  getContract:     'GET /api/records/contracts/:id',
  createContract:  'POST /api/records/contracts',
  updateContract:  'PATCH /api/records/contracts/:id',
  deleteContract:  'DELETE /api/records/contracts/:id',

  // Invoices
  listInvoices:    'GET /api/records/invoices',
  getInvoice:      'GET /api/records/invoices/:id',
  createInvoice:   'POST /api/records/invoices',
  updateInvoice:   'PATCH /api/records/invoices/:id',
  deleteInvoice:   'DELETE /api/records/invoices/:id',
} as const

// ═══════════════════════════════════════════════════════════════════
// 2. Types de données publics
// ═══════════════════════════════════════════════════════════════════

export type ContractStatus = 'draft' | 'active' | 'expired' | 'closed'

export type ContractRecord = {
  id:              ResourceId
  tenantId:        TenantId
  title:           string
  status:          ContractStatus | null
  partnerId:       ResourceId | null
  opportunityId:   ResourceId | null
  value:           string | null   // numeric → string en JSON
  startDate:       ISODate | null
  endDate:         ISODate | null
  signedAt:        ISODateTime | null
}

export type InvoiceRecord = {
  id:          ResourceId
  tenantId:    TenantId
  number:      string | null
  contractId:  ResourceId | null
  partnerId:   ResourceId | null
  amount:      string | null
  vatRate:     string | null
  dueDate:     ISODate | null
  isPaid:      boolean
  paidAt:      ISODateTime | null
}

// ═══════════════════════════════════════════════════════════════════
// 3. Événements ÉMIS (clés = WEBHOOK_PATHS dans lib/activepieces.ts)
// ═══════════════════════════════════════════════════════════════════

export type ContractSignedPayload = {
  id:            ResourceId
  tenantId:      TenantId
  title:         string
  partnerId:     ResourceId | null
  opportunityId: ResourceId | null
  value:         string | null
  signedAt:      ISODateTime | null
}

export type InvoiceDuePayload = {
  id:         ResourceId
  tenantId:   TenantId
  number:     string | null
  contractId: ResourceId | null
  amount:     string | null
  dueDate:    ISODate | null
}

export type SalesEmittedEvents =
  | EventEnvelope<'CONTRACT_SIGNED', ContractSignedPayload>
  | EventEnvelope<'INVOICE_DUE',     InvoiceDuePayload>

// ═══════════════════════════════════════════════════════════════════
// 4. Événements CONSOMMÉS
// ═══════════════════════════════════════════════════════════════════

// Quand une opportunité est gagnée, Sales peut pré-créer un brouillon de contrat.
import type { OpportunityWonPayload } from './crm.contract'

export type SalesConsumedEvents =
  | EventEnvelope<'OPPORTUNITY_WON', OpportunityWonPayload>
