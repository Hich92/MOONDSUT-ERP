import {
  pgTable, serial, text, integer, boolean, timestamp, pgEnum,
} from 'drizzle-orm/pg-core'

// ── Tenants ───────────────────────────────────────────────────────
export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended', 'cancelled'])
export const tenantPlanEnum   = pgEnum('tenant_plan',   ['trial', 'starter', 'pro', 'enterprise'])

export const tenants = pgTable('erp_tenants', {
  id:        serial('id').primaryKey(),
  slug:      text('slug').notNull().unique(),
  name:      text('name').notNull(),
  plan:      tenantPlanEnum('plan').notNull().default('trial'),
  status:    tenantStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Users ─────────────────────────────────────────────────────────
export const erpUsers = pgTable('erp_users', {
  id:           serial('id').primaryKey(),
  email:        text('email').notNull().unique(),
  name:         text('name'),
  passwordHash: text('password_hash').notNull(),
  roleId:       integer('role_id').notNull().default(80),   // 1=superadmin, 40=admin, 80=staff
  tenantId:     integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  disabled:     boolean('disabled').notNull().default(false),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Permission groups ─────────────────────────────────────────────
export const accessLevelEnum = pgEnum('access_level', ['none', 'read', 'edit'])

export const groups = pgTable('erp_groups', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const groupPermissions = pgTable('erp_group_permissions', {
  id:          serial('id').primaryKey(),
  groupId:     integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  resource:    text('resource').notNull(),
  accessLevel: accessLevelEnum('access_level').notNull().default('none'),
  ownOnly:     boolean('own_only').notNull().default(false),
})

export const userGroups = pgTable('erp_user_groups', {
  id:       serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId:   integer('user_id').notNull(),
  groupId:  integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
})

// ── Attachments ───────────────────────────────────────────────────
export const attachments = pgTable('erp_attachments', {
  id:           serial('id').primaryKey(),
  tenantId:     integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  relatedTable: text('related_table').notNull(),
  relatedId:    integer('related_id').notNull(),
  filename:     text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimetype:     text('mimetype').notNull().default('application/octet-stream'),
  size:         integer('size').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
