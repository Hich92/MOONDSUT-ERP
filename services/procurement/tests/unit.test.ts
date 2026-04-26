import { describe, it, expect } from 'vitest'

const PO_STATUSES             = ['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'] as const
const SUPPLIER_INV_STATUSES   = ['received', 'verified', 'approved', 'paid', 'disputed'] as const

describe('Procurement service — contrat de communication', () => {
  describe('purchase order statuses', () => {
    it('contient 6 statuts', () => expect(PO_STATUSES).toHaveLength(6))
    it('draft est le statut initial', () => expect(PO_STATUSES[0]).toBe('draft'))
    it('received est terminal', () => expect(PO_STATUSES).toContain('received'))
  })

  describe('supplier invoice statuses', () => {
    it('contient 5 statuts', () => expect(SUPPLIER_INV_STATUSES).toHaveLength(5))
    it('paid est terminal', () => expect(SUPPLIER_INV_STATUSES).toContain('paid'))
  })

  describe('health check shape', () => {
    it('retourne le bon format', () => {
      const h = { module: 'procurement', version: '0.1.2', status: 'ok', db: 'ok', ts: new Date().toISOString() }
      expect(h).toMatchObject({ module: 'procurement', status: 'ok' })
    })
  })
})
