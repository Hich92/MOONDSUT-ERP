import {
  pgTable, serial, integer, text, numeric, date, timestamp,
} from 'drizzle-orm/pg-core'
import { tenants } from './core'
import { partners } from './crm'

export const supplierContracts = pgTable('supplier_contracts', {
  id:              serial('id').primaryKey(),
  tenantId:        integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  partnerId:       integer('partner_id').references(() => partners.id),
  title:           text('title').notNull(),
  status:          text('status').default('draft'),
  totalValue:      numeric('total_value', { precision: 12, scale: 2 }),
  startDate:       date('start_date'),
  endDate:         date('end_date'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdByUserId: integer('created_by_user_id'),
})

export const purchaseOrders = pgTable('purchase_orders', {
  id:                 serial('id').primaryKey(),
  tenantId:           integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  partnerId:          integer('partner_id').references(() => partners.id),
  supplierContractId: integer('supplier_contract_id').references(() => supplierContracts.id),
  reference:          text('reference'),
  status:             text('status').default('draft'),
  amountHt:           numeric('amount_ht', { precision: 12, scale: 2 }),
  tvaRate:            numeric('tva_rate', { precision: 5, scale: 2 }).default('20'),
  orderDate:          date('order_date'),
  expectedDate:       date('expected_date'),
  receivedDate:       date('received_date'),
  description:        text('description'),
  notes:              text('notes'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdByUserId:    integer('created_by_user_id'),
})

export const supplierInvoices = pgTable('supplier_invoices', {
  id:                 serial('id').primaryKey(),
  tenantId:           integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  partnerId:          integer('partner_id').references(() => partners.id),
  purchaseOrderId:    integer('purchase_order_id').references(() => purchaseOrders.id),
  supplierContractId: integer('supplier_contract_id').references(() => supplierContracts.id),
  invoiceNumber:      text('invoice_number').notNull(),
  status:             text('status').default('received'),
  amountHt:           numeric('amount_ht', { precision: 12, scale: 2 }),
  tvaRate:            numeric('tva_rate', { precision: 5, scale: 2 }).default('20'),
  invoiceDate:        date('invoice_date'),
  dueDate:            date('due_date'),
  paidDate:           date('paid_date'),
  paymentRef:         text('payment_ref'),
  notes:              text('notes'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdByUserId:    integer('created_by_user_id'),
})
