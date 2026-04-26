/**
 * CORE MODULE — Contrat de communication v0.1.2
 * Responsabilité : tenants, utilisateurs, authentification, groupes, permissions.
 */

import type { TenantId, ResourceId, ISODateTime, EventEnvelope } from './_schema'

// ═══════════════════════════════════════════════════════════════════
// 1. API REST exposée
// ═══════════════════════════════════════════════════════════════════

export const CORE_API = {
  // Auth
  login:          'POST /api/auth/login',
  logout:         'DELETE /api/auth/logout',
  profile:        'POST /api/auth/profile',

  // Tenants
  createTenant:   'POST /api/tenants/create',
  checkTenant:    'GET /api/tenants/check',

  // Users (tenant-admin)
  listUsers:      'GET /api/tenant-admin/users',
  getUser:        'GET /api/tenant-admin/users/:id',
  updateUser:     'PATCH /api/tenant-admin/users/:id',
  deleteUser:     'DELETE /api/tenant-admin/users/:id',

  // Groups & permissions
  listGroups:     'GET /api/tenant-admin/groups',
  createGroup:    'POST /api/tenant-admin/groups',
  updateGroup:    'PATCH /api/tenant-admin/groups/:id',
  deleteGroup:    'DELETE /api/tenant-admin/groups/:id',
  setPermissions: 'PUT /api/tenant-admin/groups/:id/permissions',
  setMembers:     'PUT /api/tenant-admin/groups/:id/members',
} as const

// ═══════════════════════════════════════════════════════════════════
// 2. Types de données publics
// ═══════════════════════════════════════════════════════════════════

export type TenantRecord = {
  id:        TenantId
  slug:      string
  name:      string
  plan:      'trial' | 'starter' | 'pro' | 'enterprise'
  status:    'active' | 'suspended' | 'cancelled'
  createdAt: ISODateTime
}

export type UserRecord = {
  id:       ResourceId
  email:    string
  name:     string | null
  roleId:   number        // 1=superadmin, 40=admin, 80=staff
  tenantId: TenantId
  disabled: boolean
}

export type GroupRecord = {
  id:          ResourceId
  tenantId:    TenantId
  name:        string
  description: string
}

// ═══════════════════════════════════════════════════════════════════
// 3. Événements ÉMIS (via Activepieces → WEBHOOK_PATHS)
// ═══════════════════════════════════════════════════════════════════

export type TenantCreatedPayload = {
  id:    TenantId
  slug:  string
  name:  string
  email: string  // email de l'admin créateur
}

export type UserCreatedPayload = {
  id:       ResourceId
  email:    string
  tenantId: TenantId
}

// Clés AP à ajouter dans WEBHOOK_PATHS si nécessaire
export type CoreEmittedEvents =
  | EventEnvelope<'TENANT_CREATED', TenantCreatedPayload>
  | EventEnvelope<'USER_CREATED',   UserCreatedPayload>

// ═══════════════════════════════════════════════════════════════════
// 4. Événements CONSOMMÉS (flows AP qui appellent ce module)
// ═══════════════════════════════════════════════════════════════════

// Le module Core ne consomme aucun événement des autres modules.
export type CoreConsumedEvents = never
