import { query, runMigrations } from './db'

// ── Types ─────────────────────────────────────────────────────────

export type AccessLevel = 'none' | 'read' | 'edit'

export interface ResourcePerm {
  resource:     string
  access_level: AccessLevel
  own_only:     boolean
}

export type PermMap = Record<string, ResourcePerm>

// ── Resource catalogue ────────────────────────────────────────────

export const RESOURCES = [
  { key: 'partners',           label: 'Partenaires'           },
  { key: 'opportunities',      label: 'Opportunités'          },
  { key: 'contracts',          label: 'Contrats clients'      },
  { key: 'projects',           label: 'Projets'               },
  { key: 'tasks',              label: 'Tâches'                },
  { key: 'invoices',           label: 'Factures clients'      },
  { key: 'supplier_contracts', label: 'Contrats fournisseurs' },
  { key: 'purchase_orders',    label: 'Bons de commande'      },
  { key: 'supplier_invoices',  label: 'Factures fournisseurs' },
  { key: 'wiki',               label: 'Wiki'                  },
  { key: 'activities',         label: 'Activités'             },
] as const

export type ResourceKey = typeof RESOURCES[number]['key']

// Saltcorn table name → resource key
export const TABLE_TO_RESOURCE: Record<string, string> = {
  partners:           'partners',
  opportunities:      'opportunities',
  contracts:          'contracts',
  projects:           'projects',
  tasks:              'tasks',
  invoices:           'invoices',
  supplier_contracts: 'supplier_contracts',
  purchase_orders:    'purchase_orders',
  supplier_invoices:  'supplier_invoices',
  WikiPages:          'wiki',
  activities:         'activities',
}

// Resource key → owner field used for own_only filtering
export const OWNER_FIELD: Record<string, string> = {
  partners:           'created_by_user_id',
  opportunities:      'owner_id',
  contracts:          'created_by_user_id',
  projects:           'created_by_user_id',
  tasks:              'assigned_to',
  invoices:           'created_by_user_id',
  supplier_contracts: 'created_by_user_id',
  purchase_orders:    'created_by_user_id',
  supplier_invoices:  'created_by_user_id',
  wiki:               'created_by_user_id',
  activities:         'created_by',
}

// Tables where the proxy injects created_by_user_id on POST
export const INJECT_OWNER_TABLES = new Set([
  'partners', 'contracts', 'projects', 'invoices',
  'supplier_contracts', 'purchase_orders', 'supplier_invoices', 'WikiPages',
])

// ── Permission cache (30 s TTL) ───────────────────────────────────

const cache = new Map<string, { data: PermMap; exp: number }>()
const TTL = 30_000

export function invalidatePermCache(tenant: string, userId?: number): void {
  if (userId !== undefined) {
    cache.delete(`${tenant}:${userId}`)
  } else {
    for (const k of cache.keys()) {
      if (k.startsWith(`${tenant}:`)) cache.delete(k)
    }
  }
}

// ── Core helpers ──────────────────────────────────────────────────

const LEVELS: AccessLevel[] = ['none', 'read', 'edit']

function maxLevel(a: AccessLevel, b: AccessLevel): AccessLevel {
  return LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b
}

export async function getUserPermissions(
  tenant: string, userId: number
): Promise<PermMap> {
  await runMigrations()

  const cacheKey = `${tenant}:${userId}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() < hit.exp) return hit.data

  const groups = await query<{ group_id: number }>(
    'SELECT group_id FROM erp_user_groups WHERE tenant=$1 AND user_id=$2',
    [tenant, userId]
  )

  if (!groups.length) {
    cache.set(cacheKey, { data: {}, exp: Date.now() + TTL })
    return {}
  }

  const ids = groups.map(g => g.group_id)
  const rows = await query<{
    resource: string; access_level: AccessLevel; own_only: boolean
  }>(
    'SELECT resource, access_level, own_only FROM erp_group_permissions WHERE group_id = ANY($1)',
    [ids]
  )

  const map: PermMap = {}
  for (const p of rows) {
    if (!map[p.resource]) {
      map[p.resource] = { resource: p.resource, access_level: p.access_level, own_only: p.own_only }
    } else {
      map[p.resource] = {
        resource:     p.resource,
        access_level: maxLevel(map[p.resource].access_level, p.access_level),
        own_only:     map[p.resource].own_only && p.own_only,
      }
    }
  }

  cache.set(cacheKey, { data: map, exp: Date.now() + TTL })
  return map
}

export function checkAccess(map: PermMap, resource: string): ResourcePerm {
  return map[resource] ?? { resource, access_level: 'none', own_only: false }
}

// ALL_ACCESS: used for admins / main tenant (no restriction)
export function allAccess(): PermMap {
  const map: PermMap = {}
  for (const r of RESOURCES) {
    map[r.key] = { resource: r.key, access_level: 'edit', own_only: false }
  }
  return map
}
