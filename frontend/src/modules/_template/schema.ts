// Template — remplacer MODULE par le nom du module (ex: crm)
// Chaque table DOIT avoir : id, tenant_id, created_at
// Chaque table DOIT activer RLS (voir policies.sql)

import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from '@/db/schema/core'

export const moduleRecords = pgTable('module_records', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
