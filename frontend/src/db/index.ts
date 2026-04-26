import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

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

export const db = drizzle(pool, { schema })

// Contexte tenant — à appeler dans chaque route API multi-tenant
export async function withTenant<T>(
  tenantId: number,
  fn: () => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query(`SET LOCAL app.tenant_id = ${tenantId}`)
    return await fn()
  } finally {
    client.release()
  }
}
