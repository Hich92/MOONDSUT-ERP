import {
  pgTable, serial, integer, text, boolean, numeric, date, timestamp, pgEnum,
} from 'drizzle-orm/pg-core'
import { tenants } from './core'

// ── Enums ─────────────────────────────────────────────────────────
export const partnerTypeEnum = pgEnum('partner_type', [
  'contact', 'prospect', 'client', 'ex-client', 'fournisseur', 'partenaire',
])

export const opportunityStageEnum = pgEnum('opportunity_stage', [
  'lead', 'qualification', 'proposition', 'negotiation', 'won', 'lost',
])

export const activityTypeEnum   = pgEnum('activity_type',   ['Note', 'Action'])
export const activityStatusEnum = pgEnum('activity_status', ['open', 'done', 'cancelled'])

// ── Partners ──────────────────────────────────────────────────────
export const partners = pgTable('partners', {
  id:              serial('id').primaryKey(),
  tenantId:        integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  isCompany:       boolean('is_company').notNull().default(false),
  name:            text('name').notNull(),
  firstName:       text('first_name'),
  parentId:        integer('parent_id'),   // self-ref, FK added in migration
  type:            text('type').notNull().default('contact'),
  email:           text('email'),
  phone:           text('phone'),
  mobile:          text('mobile'),
  website:         text('website'),
  address:         text('address'),
  city:            text('city'),
  zip:             text('zip'),
  country:         text('country'),
  siren:           text('siren'),
  siret:           text('siret'),
  vat:             text('vat'),
  legalForm:       text('legal_form'),
  codeNaf:         text('code_naf'),
  paymentTerms:    text('payment_terms').default('30'),
  notes:           text('notes'),
  enseigne:        text('enseigne'),
  codeCommune:     text('code_commune'),
  dateCreation:    date('date_creation'),
  createdByUserId: integer('created_by_user_id'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ── Opportunities ─────────────────────────────────────────────────
export const opportunities = pgTable('opportunities', {
  id:             serial('id').primaryKey(),
  tenantId:       integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  partnerId:      integer('partner_id').references(() => partners.id),
  ownerId:        integer('owner_id'),
  stage:          text('stage').default('lead'),
  probability:    integer('probability').default(0),
  dealValue:      numeric('deal_value', { precision: 14, scale: 2 }),
  dealType:       text('deal_type'),
  submissionDate: date('submission_date'),
  closingDate:    date('closing_date'),
  tenderType:     text('tender_type'),
  hasNegotiation: boolean('has_negotiation').default(false),
  hasDemo:        boolean('has_demo').default(false),
  hasMigration:   boolean('has_migration').default(false),
})

// ── Activities (polymorphic) ───────────────────────────────────────
export const activities = pgTable('activities', {
  id:           serial('id').primaryKey(),
  tenantId:     integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type:         text('type').notNull().default('Note'),
  content:      text('content'),
  status:       text('status').default('open'),
  dueDate:      date('due_date'),
  relatedTable: text('related_table'),
  relatedId:    integer('related_id'),
  createdBy:    integer('created_by'),
  assignedTo:   integer('assigned_to'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolvedAt:   timestamp('resolved_at', { withTimezone: true }),
})
