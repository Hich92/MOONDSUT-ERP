import { describe, it, expect } from 'vitest'

// Logique métier pure — pas de DB
describe('CRM — logique métier', () => {

  describe('probabilité par stage', () => {
    const STAGE_PROBABILITY: Record<string, number> = {
      lead:          10,
      qualification: 25,
      proposition:   50,
      negotiation:   75,
      won:          100,
      lost:           0,
    }

    it('couvre tous les stages', () => {
      const stages = ['lead','qualification','proposition','negotiation','won','lost']
      stages.forEach(s => expect(STAGE_PROBABILITY).toHaveProperty(s))
    })

    it('won = 100%, lost = 0%', () => {
      expect(STAGE_PROBABILITY['won']).toBe(100)
      expect(STAGE_PROBABILITY['lost']).toBe(0)
    })

    it('probabilité croissante lead → negotiation', () => {
      const ordered = ['lead','qualification','proposition','negotiation']
      for (let i = 1; i < ordered.length; i++) {
        expect(STAGE_PROBABILITY[ordered[i]]).toBeGreaterThan(STAGE_PROBABILITY[ordered[i-1]])
      }
    })
  })

  describe('label partenaire', () => {
    function partnerLabel(name: string, firstName?: string | null, isCompany?: boolean): string {
      if (isCompany) return name
      return firstName ? `${firstName} ${name}` : name
    }

    it('société → nom seul', () => {
      expect(partnerLabel('Acme SAS', undefined, true)).toBe('Acme SAS')
    })

    it('personne avec prénom → prénom + nom', () => {
      expect(partnerLabel('Martin', 'Jean', false)).toBe('Jean Martin')
    })

    it('personne sans prénom → nom seul', () => {
      expect(partnerLabel('Martin', null, false)).toBe('Martin')
    })
  })

  describe('types partenaire valides', () => {
    const VALID_TYPES = ['contact','prospect','client','ex-client','fournisseur','partenaire']

    it('contient 6 types', () => expect(VALID_TYPES).toHaveLength(6))
    it('fournisseur est un type valide', () => expect(VALID_TYPES).toContain('fournisseur'))
  })
})
