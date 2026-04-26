/**
 * PROCUREMENT MODULE — Contrat de communication v0.1.2
 * Responsabilité : contrats fournisseurs, bons de commande, factures fournisseurs.
 */

import type { TenantId, ResourceId, ISODate, ISODateTime, EventEnvelope } from './_schema'

// ═══════════════════════════════════════════════════════════════════
// 1. API REST exposée
// ═══════════════════════════════════════════════════════════════════

export const PROCUREMENT_API = {
  // Supplier contracts
  listSupplierContracts:   'GET /api/records/supplier_contracts',
  getSupplierContract:     'GET /api/records/supplier_contracts/:id',
  createSupplierContract:  'POST /api/records/supplier_contracts',
  updateSupplierContract:  'PATCH /api/records/supplier_contracts/:id',
  deleteSupplierContract:  'DELETE /api/records/supplier_contracts/:id',

  // Purchase orders
  listPurchaseOrders:      'GET /api/records/purchase_orders',
  getPurchaseOrder:        'GET /api/records/purchase_orders/:id',
  createPurchaseOrder:     'POST /api/records/purchase_orders',
  updatePurchaseOrder:     'PATCH /api/records/purchase_orders/:id',
  deletePurchaseOrder:     'DELETE /api/records/purchase_orders/:id',

  // Supplier invoices
  listSupplierInvoices:    'GET /api/records/supplier_invoices',
  getSupplierInvoice:      'GET /api/records/supplier_invoices/:id',
  createSupplierInvoice:   'POST /api/records/supplier_invoices',
  updateSupplierInvoice:   'PATCH /api/records/supplier_invoices/:id',
  deleteSupplierInvoice:   'DELETE /api/records/supplier_invoices/:id',
} as const

// ═══════════════════════════════════════════════════════════════════
// 2. Types de données publics
// ═══════════════════════════════════════════════════════════════════

export type SupplierContractStatus = 'draft' | 'active' | 'expired' | 'terminated'

export type SupplierContractRecord = {
  id:        ResourceId
  tenantId:  TenantId
  title:     string
  partnerId: ResourceId | null   // fournisseur (partners.type = 'fournisseur')
  status:    SupplierContractStatus | null
  value:     string | null
  startDate: ISODate | null
  endDate:   ISODate | null
}

export type PurchaseOrderStatus =
  | 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled'

export type PurchaseOrderRecord = {
  id:                 ResourceId
  tenantId:           TenantId
  reference:          string | null
  partnerId:          ResourceId | null
  supplierContractId: ResourceId | null
  status:             PurchaseOrderStatus | null
  totalAmount:        string | null
  orderedAt:          ISODate | null
  expectedAt:         ISODate | null
}

export type SupplierInvoiceStatus = 'received' | 'verified' | 'approved' | 'paid' | 'disputed'

export type SupplierInvoiceRecord = {
  id:              ResourceId
  tenantId:        TenantId
  invoiceNumber:   string | null
  partnerId:       ResourceId | null
  purchaseOrderId: ResourceId | null
  status:          SupplierInvoiceStatus | null
  amount:          string | null
  vatAmount:       string | null
  dueDate:         ISODate | null
  paidAt:          ISODateTime | null
}

// ═══════════════════════════════════════════════════════════════════
// 3. Événements ÉMIS
// ═══════════════════════════════════════════════════════════════════

export type PurchaseOrderSentPayload = {
  id:          ResourceId
  tenantId:    TenantId
  reference:   string | null
  partnerId:   ResourceId | null
  totalAmount: string | null
  sentAt:      ISODateTime
}

export type SupplierInvoicePaidPayload = {
  id:       ResourceId
  tenantId: TenantId
  amount:   string | null
  paidAt:   ISODateTime
}

export type ProcurementEmittedEvents =
  | EventEnvelope<'PURCHASE_ORDER_SENT',    PurchaseOrderSentPayload>
  | EventEnvelope<'SUPPLIER_INVOICE_PAID',  SupplierInvoicePaidPayload>

// ═══════════════════════════════════════════════════════════════════
// 4. Événements CONSOMMÉS
// ═══════════════════════════════════════════════════════════════════

// Le module Procurement est autonome — aucune dépendance sur les événements
// des autres modules dans l'état actuel (v0.1.2).
export type ProcurementConsumedEvents = never
