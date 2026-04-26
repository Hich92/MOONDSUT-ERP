import { describe, it, expect } from 'vitest'

describe('Projects — logique métier', () => {

  describe('statuts projet', () => {
    const STATUSES = ['planned', 'in_progress', 'on_hold', 'delivered', 'cancelled']
    it('contient 5 statuts', () => expect(STATUSES).toHaveLength(5))
    it('planned est le statut initial', () => expect(STATUSES[0]).toBe('planned'))
  })

  describe('progression', () => {
    function clampProgress(v: number): number {
      return Math.min(100, Math.max(0, v))
    }
    it('borne min 0',    () => expect(clampProgress(-5)).toBe(0))
    it('borne max 100',  () => expect(clampProgress(150)).toBe(100))
    it('valeur normale', () => expect(clampProgress(42)).toBe(42))
  })

  describe('statuts tâche', () => {
    const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done']
    it('contient 4 statuts', () => expect(TASK_STATUSES).toHaveLength(4))

    function isTerminal(s: string): boolean { return s === 'done' }
    it('done est terminal', () => expect(isTerminal('done')).toBe(true))
    it('in_progress non terminal', () => expect(isTerminal('in_progress')).toBe(false))
  })

  describe('coût tâche', () => {
    function taskCost(estHours: number, hourlyCost: number): number {
      return Math.round(estHours * hourlyCost * 100) / 100
    }
    it('coût simple', () => expect(taskCost(8, 75)).toBe(600))
    it('coût zéro si heures nulles', () => expect(taskCost(0, 75)).toBe(0))
  })
})
