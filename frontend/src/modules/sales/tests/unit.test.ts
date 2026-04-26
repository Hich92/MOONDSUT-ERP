import { describe, it, expect } from 'vitest'

describe('Sales — logique métier', () => {

  describe('statuts contrat', () => {
    const STATUSES = ['draft', 'active', 'expired', 'closed']
    it('contient 4 statuts', () => expect(STATUSES).toHaveLength(4))
    it('draft est le statut initial', () => expect(STATUSES[0]).toBe('draft'))
  })

  describe('calcul TVA', () => {
    function amountTtc(ht: number, tva = 20): number {
      return Math.round(ht * (1 + tva / 100) * 100) / 100
    }
    it('20% TVA', () => expect(amountTtc(100)).toBe(120))
    it('0% TVA', ()  => expect(amountTtc(100, 0)).toBe(100))
    it('arrondi centimes', () => expect(amountTtc(33.33)).toBe(40))
  })

  describe('numérotation facture', () => {
    function nextInvoiceNumber(prefix: string, last: number): string {
      return `${prefix}-${String(last + 1).padStart(4, '0')}`
    }
    it('génère le bon numéro', () => expect(nextInvoiceNumber('FAC', 3)).toBe('FAC-0004'))
    it('padding 4 chiffres',   () => expect(nextInvoiceNumber('FAC', 99)).toBe('FAC-0100'))
  })
})
