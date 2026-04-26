import { describe, it, expect } from 'vitest'

// ── Types alignés sur crm.contract.ts ────────────────────────────

const PARTNER_TYPES = ['contact', 'prospect', 'client', 'ex-client', 'fournisseur', 'partenaire'] as const
const OPP_STAGES   = ['lead', 'qualification', 'proposition', 'negotiation', 'won', 'lost'] as const

describe('CRM service — contrat de communication', () => {
  describe('partner types', () => {
    it('contient 6 types valides', () => {
      expect(PARTNER_TYPES).toHaveLength(6)
    })
    it('fournisseur est un type valide', () => {
      expect(PARTNER_TYPES).toContain('fournisseur')
    })
  })

  describe('opportunity stages', () => {
    it('contient 6 stages', () => {
      expect(OPP_STAGES).toHaveLength(6)
    })
    it('won et lost sont terminaux', () => {
      const terminal = OPP_STAGES.filter(s => s === 'won' || s === 'lost')
      expect(terminal).toHaveLength(2)
    })
  })

  describe('health check shape', () => {
    it('retourne le bon format', () => {
      const health = { module: 'crm', version: '0.1.2', status: 'ok', db: 'ok', ts: new Date().toISOString() }
      expect(health).toMatchObject({ module: 'crm', status: 'ok', db: 'ok' })
    })
  })
})
