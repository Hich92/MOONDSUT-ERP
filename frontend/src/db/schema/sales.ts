import {
  pgTable, serial, integer, text, boolean, numeric, date, varchar,
} from 'drizzle-orm/pg-core'
import { tenants } from './core'
import { partners, opportunities } from './crm'

export const contracts = pgTable('contracts', {
  id:              serial('id').primaryKey(),
  tenantId:        integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  opportunityId:   integer('opportunity_id').references(() => opportunities.id, { onDelete: 'set null' }),
  partnerId:       integer('partner_id').references(() => partners.id),
  title:           varchar('title', { length: 255 }),
  status:          text('status').default('draft'),
  startDate:       date('start_date'),
  endDate:         date('end_date'),
  totalValue:      numeric('total_value', { precision: 14, scale: 2 }),
  createdByUserId: integer('created_by_user_id'),
})

export const invoices = pgTable('invoices', {
  id:              serial('id').primaryKey(),
  tenantId:        integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contractId:      integer('contract_id').references(() => contracts.id, { onDelete: 'set null' }),
  invoiceNumber:   text('invoice_number'),
  amountHt:        numeric('amount_ht', { precision: 14, scale: 2 }),
  isPaid:          boolean('is_paid').default(false),
  issueDate:       date('issue_date'),
  createdByUserId: integer('created_by_user_id'),
})
