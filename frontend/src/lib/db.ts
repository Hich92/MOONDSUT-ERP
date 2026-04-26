import { Pool } from 'pg'

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host:     process.env.POSTGRES_HOST     ?? 'db',
        port:     Number(process.env.POSTGRES_PORT ?? 5432),
        database: process.env.POSTGRES_DB       ?? 'erp',
        user:     process.env.POSTGRES_USER     ?? 'erp',
        password: process.env.POSTGRES_PASSWORD ?? '',
      }
)

export async function query<T = Record<string, unknown>>(
  sql: string, params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query(sql, params)
  return rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string, params?: unknown[]
): Promise<T | null> {
  const [row] = await query<T>(sql, params)
  return row ?? null
}

// ── Auto-migration (idempotent, run once per process) ─────────────

let migrationPromise: Promise<void> | null = null

export function runMigrations(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = doMigrate().catch(err => {
      migrationPromise = null
      throw err
    })
  }
  return migrationPromise
}

async function doMigrate(): Promise<void> {
  // Groups
  await pool.query(`
    CREATE TABLE IF NOT EXISTS erp_groups (
      id          SERIAL PRIMARY KEY,
      tenant      TEXT NOT NULL DEFAULT '',
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(tenant, name)
    )
  `)

  // Per-group resource permissions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS erp_group_permissions (
      id           SERIAL PRIMARY KEY,
      group_id     INTEGER NOT NULL REFERENCES erp_groups(id) ON DELETE CASCADE,
      resource     TEXT NOT NULL,
      access_level TEXT NOT NULL DEFAULT 'none'
        CHECK (access_level IN ('none','read','edit')),
      own_only     BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE(group_id, resource)
    )
  `)

  // User ↔ Group membership (tenant-scoped user IDs, no FK across schemas)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS erp_user_groups (
      id       SERIAL PRIMARY KEY,
      tenant   TEXT NOT NULL DEFAULT '',
      user_id  INTEGER NOT NULL,
      group_id INTEGER NOT NULL REFERENCES erp_groups(id) ON DELETE CASCADE,
      UNIQUE(tenant, user_id, group_id)
    )
  `)

  // Add created_by_user_id to business tables that lack a user-ownership field
  const tables = [
    'partners', 'contracts', 'projects', 'invoices',
    'supplier_contracts', 'purchase_orders', 'supplier_invoices',
  ]
  for (const t of tables) {
    await pool.query(
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER`
    )
  }
  // WikiPages uses double-quoted name (mixed case)
  await pool.query(
    `ALTER TABLE "WikiPages" ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER`
  )

}
