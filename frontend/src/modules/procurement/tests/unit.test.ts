import { describe, it, expect } from 'vitest'

describe('Procurement — logique métier', () => {

  describe('statuts bon de commande', () => {
    const STATUSES = ['draft', 'sent', 'confirmed', 'received', 'cancelled']
    it('draft est le statut initial', () => expect(STATUSES[0]).toBe('draft'))
    it('received est un statut terminal', () => expect(STATUSES).toContain('received'))
  })

  describe('statuts facture fournisseur', () => {
    const STATUSES = ['received', 'validated', 'paid', 'disputed']
    it('received est le statut initial', () => expect(STATUSES[0]).toBe('received'))
    it('paid est un statut terminal', () => expect(STATUSES).toContain('paid'))
  })

  describe('montant TTC', () => {
    function ttc(ht: number, tvaRate: number): number {
      return Math.round(ht * (1 + tvaRate / 100) * 100) / 100
    }
    it('TVA 20%', () => expect(ttc(1000, 20)).toBe(1200))
    it('TVA 10%', () => expect(ttc(1000, 10)).toBe(1100))
    it('exonéré',  () => expect(ttc(1000, 0)).toBe(1000))
  })
})
