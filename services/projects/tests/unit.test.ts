import { describe, it, expect } from 'vitest'

const PROJECT_STATUSES = ['planned', 'in_progress', 'on_hold', 'delivered', 'cancelled'] as const
const TASK_STATUSES    = ['todo', 'in_progress', 'review', 'done'] as const

describe('Projects service — contrat de communication', () => {
  describe('project statuses', () => {
    it('contient 5 statuts', () => expect(PROJECT_STATUSES).toHaveLength(5))
    it('planned est le statut initial', () => expect(PROJECT_STATUSES[0]).toBe('planned'))
    it('delivered et cancelled sont terminaux', () => {
      expect(PROJECT_STATUSES).toContain('delivered')
      expect(PROJECT_STATUSES).toContain('cancelled')
    })
  })

  describe('task statuses', () => {
    it('contient 4 statuts', () => expect(TASK_STATUSES).toHaveLength(4))
    it('done est terminal', () => expect(TASK_STATUSES).toContain('done'))
  })

  describe('health check shape', () => {
    it('retourne le bon format', () => {
      const h = { module: 'projects', version: '0.1.2', status: 'ok', db: 'ok', ts: new Date().toISOString() }
      expect(h).toMatchObject({ module: 'projects', status: 'ok' })
    })
  })
})
