/**
 * PROJECTS MODULE — Contrat de communication v0.1.2
 * Responsabilité : projets, tâches.
 */

import type { TenantId, ResourceId, ISODate, ISODateTime, EventEnvelope } from './_schema'

// ═══════════════════════════════════════════════════════════════════
// 1. API REST exposée
// ═══════════════════════════════════════════════════════════════════

export const PROJECTS_API = {
  // Projects
  listProjects:   'GET /api/records/projects',
  getProject:     'GET /api/records/projects/:id',
  createProject:  'POST /api/records/projects',
  updateProject:  'PATCH /api/records/projects/:id',
  deleteProject:  'DELETE /api/records/projects/:id',

  // Tasks
  listTasks:      'GET /api/records/tasks',
  getTask:        'GET /api/records/tasks/:id',
  createTask:     'POST /api/records/tasks',
  updateTask:     'PATCH /api/records/tasks/:id',
  deleteTask:     'DELETE /api/records/tasks/:id',

  // My tasks (vue personnelle)
  myTasks:        'GET /api/my-tasks',
} as const

// ═══════════════════════════════════════════════════════════════════
// 2. Types de données publics
// ═══════════════════════════════════════════════════════════════════

export type ProjectStatus =
  | 'planned' | 'in_progress' | 'on_hold' | 'delivered' | 'cancelled'

export type ProjectRecord = {
  id:         ResourceId
  tenantId:   TenantId
  name:       string
  status:     ProjectStatus | null
  contractId: ResourceId | null
  managerId:  ResourceId | null
  startDate:  ISODate | null
  dueDate:    ISODate | null
}

export type TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export type TaskRecord = {
  id:          ResourceId
  tenantId:    TenantId
  title:       string
  status:      TaskStatus | null
  priority:    TaskPriority | null
  projectId:   ResourceId | null
  assignedTo:  ResourceId | null
  dueDate:     ISODate | null
  completedAt: ISODateTime | null
}

// ═══════════════════════════════════════════════════════════════════
// 3. Événements ÉMIS
// ═══════════════════════════════════════════════════════════════════

export type ProjectCreatedPayload = {
  id:         ResourceId
  tenantId:   TenantId
  name:       string
  contractId: ResourceId | null
  status:     ProjectStatus | null
}

export type TaskCompletedPayload = {
  id:          ResourceId
  tenantId:    TenantId
  title:       string
  projectId:   ResourceId | null
  assignedTo:  ResourceId | null
  completedAt: ISODateTime
}

export type ProjectsEmittedEvents =
  | EventEnvelope<'PROJECT_CREATED',  ProjectCreatedPayload>
  | EventEnvelope<'TASK_COMPLETED',   TaskCompletedPayload>

// ═══════════════════════════════════════════════════════════════════
// 4. Événements CONSOMMÉS
// ═══════════════════════════════════════════════════════════════════

// Quand un contrat est signé, Projects peut créer un projet automatiquement.
import type { ContractSignedPayload } from './sales.contract'

export type ProjectsConsumedEvents =
  | EventEnvelope<'CONTRACT_SIGNED', ContractSignedPayload>
