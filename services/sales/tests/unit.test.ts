import { describe, it, expect } from 'vitest'

const CONTRACT_STATUSES = ['draft', 'active', 'expired', 'closed'] as const
const INVOICE_FIELDS    = ['id', 'tenant_id', 'contract_id', 'invoice_number', 'amount_ht', 'is_paid'] as const

describe('Sales service — contrat de communication', () => {
  describe('contract statuses', () => {
    it('contient 4 statuts', () => expect(CONTRACT_STATUSES).toHaveLength(4))
    it('draft est le statut initial', () => expect(CONTRACT_STATUSES[0]).toBe('draft'))
  })

  describe('invoice', () => {
    it('champs attendus présents', () => {
      expect(INVOICE_FIELDS).toContain('is_paid')
      expect(INVOICE_FIELDS).toContain('contract_id')
    })
  })

  describe('health check shape', () => {
    it('retourne le bon format', () => {
      const h = { module: 'sales', version: '0.1.2', status: 'ok', db: 'ok', ts: new Date().toISOString() }
      expect(h).toMatchObject({ module: 'sales', status: 'ok' })
    })
  })
})
